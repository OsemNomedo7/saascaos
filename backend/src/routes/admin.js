const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Content = require('../models/Content');
const Post = require('../models/Post');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// GET /api/admin/dashboard - Stats overview
router.get('/dashboard', auth, admin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSubscriptions,
      totalContent,
      totalPosts,
      newUsersThisMonth,
      newSubscriptionsThisMonth,
      recentLogs,
      subscriptionsByPlan,
      revenue,
    ] = await Promise.all([
      User.countDocuments({ isBanned: false }),
      Subscription.countDocuments({ status: 'active' }),
      Content.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Subscription.countDocuments({ status: 'active', createdAt: { $gte: thirtyDaysAgo } }),
      Log.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email'),
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$plan', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      ]),
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        totalContent,
        totalPosts,
        newUsersThisMonth,
        newSubscriptionsThisMonth,
        totalRevenue: revenue[0]?.total || 0,
      },
      subscriptionsByPlan,
      recentLogs,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, level, isBanned } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (level) query.level = level;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, plan } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;
    if (plan) query.plan = plan;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email level'),
      Subscription.countDocuments(query),
    ]);

    res.json({
      subscriptions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/logs
router.get('/logs', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email'),
      Log.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/revenue
router.get('/revenue', auth, admin, async (req, res) => {
  try {
    const monthlyRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    const byGateway = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const byPlan = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({ monthlyRevenue, byGateway, byPlan });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/notify - send notification to users
router.post('/notify', auth, admin, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const { title, message, type = 'system', link, target = 'all', plan } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message required.' });

    let userQuery = { isActive: true, isBanned: false };
    if (target === 'subscribers') {
      const subs = await Subscription.find({ status: 'active' }).select('user');
      userQuery._id = { $in: subs.map(s => s.user) };
    }
    const users = await User.find(userQuery).select('_id');
    const notifications = users.map(u => ({ user: u._id, type, title, message, link }));
    await Notification.insertMany(notifications);
    res.json({ message: `Sent to ${users.length} users.`, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/export/users - CSV export
router.get('/export/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('name email level role isActive isBanned createdAt').lean();
    const subs = await Subscription.find({ status: 'active' }).select('user plan endDate').lean();
    const subMap = {};
    subs.forEach(s => { subMap[s.user.toString()] = s; });

    const header = 'ID,Name,Email,Level,Role,Active,Banned,Plan,Joined\n';
    const rows = users.map(u => {
      const sub = subMap[u._id.toString()];
      return [
        u._id,
        u.name,
        u.email,
        u.level,
        u.role,
        u.isActive,
        u.isBanned,
        sub?.plan || 'none',
        new Date(u.createdAt).toISOString(),
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(header + rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/coupons
router.get('/coupons', auth, admin, async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', auth, admin, async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ message: 'Coupon created.', coupon });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Coupon code already exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', auth, admin, async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Coupon deactivated.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/stats/growth - user + subscription growth for charts
router.get('/stats/growth', auth, admin, async (req, res) => {
  try {
    const days = 30;
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      const [newUsers, newSubs] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Subscription.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      ]);
      results.push({ date: start.toISOString().slice(0, 10), newUsers, newSubs });
    }
    res.json({ growth: results });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
