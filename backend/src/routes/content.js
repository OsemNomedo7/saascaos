const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const requireSubscription = require('../middlewares/subscription');

// Multer config (local storage, swap for S3 in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const unique = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // Accept all files
  },
});

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

    // Apply level filter only if explicitly requested
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

    // Level check
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

// POST /api/content/:id/download - Increment download counter
router.post('/:id/download', auth, requireSubscription, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found.' });
    }

    const userLevelOrder = LEVEL_ORDER[req.user.level] || 0;
    const contentLevelOrder = LEVEL_ORDER[content.minLevel] || 0;
    if (userLevelOrder < contentLevelOrder && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient level.' });
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

    res.json({ message: 'Download registered.', fileUrl: content.fileUrl, externalLink: content.externalLink });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/content/upload - File upload
router.post('/upload', auth, admin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

    await Log.create({
      user: req.user._id,
      action: 'upload',
      metadata: { filename: req.file.filename, size: req.file.size },
    });

    res.json({
      message: 'File uploaded.',
      fileUrl,
      fileKey: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed.' });
  }
});

// POST /api/content/upload-image - Image upload (admin only)
router.post('/upload-image', auth, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded.' });
    }

    const imageUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

    res.json({
      message: 'Image uploaded.',
      imageUrl,
      fileKey: req.file.filename,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Image upload failed.' });
  }
});

module.exports = router;
