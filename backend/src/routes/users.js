const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// GET /api/users - Admin: list all users
router.get('/', auth, admin, async (req, res) => {
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
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Non-admins can only view their own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/:id - Update profile
router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      // Only admin or own user
      if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const allowedFields = ['name', 'avatar'];
      if (req.user.role === 'admin') {
        allowedFields.push('email', 'isActive', 'role');
      }

      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!user) return res.status(404).json({ message: 'User not found.' });

      res.json({ message: 'Profile updated.', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/users/:id - Admin: ban user
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, banReason: reason || 'Violation of terms' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await Log.create({
      user: req.user._id,
      action: 'ban',
      resourceId: user._id,
      resourceType: 'User',
      metadata: { reason, targetUser: user.email },
    });

    res.json({ message: 'User banned.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/users/:id/level - Admin: change user level
router.put('/:id/level', auth, admin, async (req, res) => {
  try {
    const { level } = req.body;
    const validLevels = ['iniciante', 'intermediario', 'avancado', 'elite'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: 'Invalid level.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { level }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Level updated.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/:id/activity - User activity logs
router.get('/:id/activity', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const logs = await Log.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email');

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
