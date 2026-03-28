const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Multer config for avatar/banner images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const unique = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

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

// GET /api/users/me/favorites
router.get('/me/favorites', auth, async (req, res) => {
  try {
    const Favorite = require('../models/Favorite');
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'content', populate: { path: 'category', select: 'name slug color icon' } });
    res.json({ favorites: favorites.map(f => f.content).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/me/favorites/ids - just return array of content IDs user has favorited
router.get('/me/favorites/ids', auth, async (req, res) => {
  try {
    const Favorite = require('../models/Favorite');
    const favs = await Favorite.find({ user: req.user._id }).select('content');
    res.json({ ids: favs.map(f => f.content.toString()) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/users/me/favorites/:contentId
router.post('/me/favorites/:contentId', auth, async (req, res) => {
  try {
    const Favorite = require('../models/Favorite');
    await Favorite.findOneAndDelete({ user: req.user._id, content: req.params.contentId });
    const fav = await Favorite.create({ user: req.user._id, content: req.params.contentId });
    res.status(201).json({ message: 'Added to favorites.', favorite: fav });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Already favorited.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/users/me/favorites/:contentId
router.delete('/me/favorites/:contentId', auth, async (req, res) => {
  try {
    const Favorite = require('../models/Favorite');
    await Favorite.findOneAndDelete({ user: req.user._id, content: req.params.contentId });
    res.json({ message: 'Removed from favorites.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/me/downloads - download history from logs
router.get('/me/downloads', auth, async (req, res) => {
  try {
    const Content = require('../models/Content');
    const logs = await Log.find({ user: req.user._id, action: 'download' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const contentIds = [...new Set(logs.map(l => l.resourceId?.toString()).filter(Boolean))];
    const contents = await Content.find({ _id: { $in: contentIds }, isActive: true })
      .populate('category', 'name slug color icon');
    const contentMap = {};
    contents.forEach(c => { contentMap[c._id.toString()] = c; });
    const history = logs
      .map(l => ({ ...contentMap[l.resourceId?.toString()], downloadedAt: l.createdAt }))
      .filter(c => c._id);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/users/me/avatar - upload avatar image
router.post('/me/avatar', auth, uploadImage.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
    const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true });
    res.json({ message: 'Avatar updated.', avatarUrl, user });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message || 'Upload failed.' });
  }
});

// POST /api/users/me/banner - upload banner image
router.post('/me/banner', auth, uploadImage.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
    const bannerUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { bannerUrl }, { new: true });
    res.json({ message: 'Banner updated.', bannerUrl, user });
  } catch (error) {
    console.error('Banner upload error:', error);
    res.status(500).json({ message: error.message || 'Upload failed.' });
  }
});

// PUT /api/users/me/profile - update bio, socialLinks, bannerUrl
router.put('/me/profile', auth, async (req, res) => {
  try {
    const { name, bio, socialLinks, bannerUrl } = req.body;
    const updates = {};
    if (name !== undefined && name.trim().length >= 2) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: 'Profile updated.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/users/:id/public - public profile
router.get('/:id/public', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar bannerUrl bio level xp achievements socialLinks createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const Review = require('../models/Review');
    const [downloadCount, reviewCount] = await Promise.all([
      Log.countDocuments({ user: user._id, action: 'download' }),
      Review.countDocuments({ user: user._id }),
    ]);

    res.json({ user, stats: { downloads: downloadCount, reviews: reviewCount } });
  } catch (error) {
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

      const allowedFields = ['name', 'avatar', 'bio', 'bannerUrl', 'socialLinks'];
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
