const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const Review = require('../models/Review');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const requireSubscription = require('../middlewares/subscription');
const { addXp } = require('../utils/xp');
const { imageUpload, fileUpload, getFileUrl } = require('../config/storage');

const upload = fileUpload();
const uploadImage = imageUpload();

const LEVEL_ORDER = { iniciante: 0, intermediario: 1, avancado: 2, elite: 3 };

// GET /api/content
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, type, level, search, sort = '-createdAt', isDrop } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isActive: true };
    if (category) query.category = category;
    if (type) query.type = type;
    if (isDrop !== undefined) query.isDrop = isDrop === 'true';
    if (level) query.minLevel = level;

    if (search) {
      query.$text = { $search: search };
    }

    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug color icon')
        .populate('createdBy', 'name'),
      Content.countDocuments(query),
    ]);

    res.json({
      contents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/content/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('category', 'name slug color icon')
      .populate('createdBy', 'name');

    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    const userLevelOrder = LEVEL_ORDER[req.user.level] || 0;
    const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
    if (userLevelOrder < contentLevelOrder && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Your level is insufficient to access this content.' });
    }

    content.views += 1;
    await content.save();

    await Log.create({
      user: req.user._id,
      action: 'access',
      resourceId: content._id,
      resourceType: 'Content',
      ip: req.ip,
    });

    res.json({ content });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/content - Admin create
router.post(
  '/',
  auth,
  admin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('type').isIn(['programa', 'database', 'material', 'esquema', 'video', 'outro']).withMessage('Invalid type'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const contentData = { ...req.body, createdBy: req.user._id };
      const content = await Content.create(contentData);
      res.status(201).json({ message: 'Content created.', content });
    } catch (error) {
      console.error('Create content error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// PUT /api/content/:id - Admin update
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!content) return res.status(404).json({ message: 'Content not found.' });
    res.json({ message: 'Content updated.', content });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/content/:id - Admin soft delete
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!content) return res.status(404).json({ message: 'Content not found.' });
    res.json({ message: 'Content deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/content/:id/download
router.post('/:id/download', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    const userLevelOrder = LEVEL_ORDER[req.user.level] || 0;
    const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
    if (userLevelOrder < contentLevelOrder && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient level.', code: 'LEVEL_REQUIRED' });
    }

    // Free content: anyone can download
    // Paid content: require active subscription (unless admin)
    if (!content.isFree && req.user.role !== 'admin') {
      const Subscription = require('../models/Subscription');
      const sub = await Subscription.findOne({ user: req.user._id, status: 'active' });
      if (!sub) {
        return res.status(403).json({
          message: 'Active subscription required to download this content.',
          code: 'NO_SUBSCRIPTION',
        });
      }
      if (sub.plan !== 'lifetime' && sub.endDate && new Date() > sub.endDate) {
        sub.status = 'expired';
        await sub.save();
        return res.status(403).json({
          message: 'Your subscription has expired.',
          code: 'SUBSCRIPTION_EXPIRED',
        });
      }
    }

    content.downloads += 1;
    await content.save();

    await Log.create({
      user: req.user._id,
      action: 'download',
      resourceId: content._id,
      resourceType: 'Content',
      ip: req.ip,
      metadata: { title: content.title },
    });

    addXp(req.user._id, 'download').catch(() => {});

    res.json({ message: 'Download registered.', fileUrl: content.fileUrl, externalLink: content.externalLink });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ──────────────────────────── REVIEWS ────────────────────────────

// GET /api/content/:id/reviews
router.get('/:id/reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ content: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar level');

    // Aggregate rating stats
    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    // Find current user's review
    const myReview = reviews.find((r) => r.user?._id?.toString() === req.user._id.toString());

    res.json({
      reviews,
      stats: { total, avgRating: Math.round(avgRating * 10) / 10, distribution },
      myReview: myReview || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/content/:id/reviews
router.post(
  '/:id/reviews',
  auth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const content = await Content.findById(req.params.id);
      if (!content || !content.isActive) {
        return res.status(404).json({ message: 'Content not found.' });
      }

      const { rating, comment } = req.body;

      // Upsert: update if exists, create otherwise
      const review = await Review.findOneAndUpdate(
        { content: req.params.id, user: req.user._id },
        { rating, comment: comment || '' },
        { upsert: true, new: true, runValidators: true }
      ).populate('user', 'name avatar level');

      addXp(req.user._id, 'review').catch(() => {});

      res.status(201).json({ message: 'Review saved.', review });
    } catch (error) {
      console.error('Review error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/content/:id/reviews/:reviewId
router.delete('/:id/reviews/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ────────────────────────── FILE UPLOADS ──────────────────────────

// POST /api/content/upload
router.post('/upload', auth, admin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const fileUrl = getFileUrl(req.file);

    await Log.create({
      user: req.user._id,
      action: 'upload',
      metadata: { filename: req.file.filename || req.file.public_id, size: req.file.size },
    });

    res.json({
      message: 'File uploaded.',
      fileUrl,
      fileKey: req.file.filename || req.file.public_id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed.' });
  }
});

// POST /api/content/upload-image
router.post('/upload-image', auth, admin, uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });

    const imageUrl = getFileUrl(req.file);

    res.json({ message: 'Image uploaded.', imageUrl, fileKey: req.file.filename });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Image upload failed.' });
  }
});

module.exports = router;
