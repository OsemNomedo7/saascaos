const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const requireSubscription = require('../middlewares/subscription');

// GET /api/drops - Active drops (visible to all logged-in users)
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const drops = await Content.find({
      isDrop: true,
      isActive: true,
      dropExpiresAt: { $gt: now },
    })
      .sort({ dropExpiresAt: 1 })
      .populate('category', 'name slug color icon')
      .populate('createdBy', 'name');

    res.json({ drops });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/drops/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const drop = await Content.findOne({
      _id: req.params.id,
      isDrop: true,
      isActive: true,
    })
      .populate('category', 'name slug color icon')
      .populate('createdBy', 'name');

    if (!drop) return res.status(404).json({ message: 'Drop not found.' });

    const now = new Date();
    if (drop.dropExpiresAt && drop.dropExpiresAt < now) {
      return res.status(410).json({ message: 'This drop has expired.' });
    }

    res.json({ drop });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/drops - Admin create drop
router.post(
  '/',
  auth,
  admin,
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('category').notEmpty().withMessage('Category required'),
    body('type').isIn(['programa', 'database', 'material', 'esquema', 'video', 'outro']).withMessage('Invalid type'),
    body('dropExpiresAt').notEmpty().withMessage('Expiration date required').isISO8601().withMessage('Invalid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const drop = await Content.create({
        ...req.body,
        isDrop: true,
        createdBy: req.user._id,
      });

      res.status(201).json({ message: 'Drop created.', drop });
    } catch (error) {
      console.error('Create drop error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// PUT /api/drops/:id - Admin update drop
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const drop = await Content.findOneAndUpdate(
      { _id: req.params.id, isDrop: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!drop) return res.status(404).json({ message: 'Drop not found.' });
    res.json({ message: 'Drop updated.', drop });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/drops/:id - Admin delete drop
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const drop = await Content.findOneAndUpdate(
      { _id: req.params.id, isDrop: true },
      { isActive: false },
      { new: true }
    );
    if (!drop) return res.status(404).json({ message: 'Drop not found.' });
    res.json({ message: 'Drop deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
