const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

// Helper: generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/categories - Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .populate('createdBy', 'name');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).populate('createdBy', 'name');
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/categories - Admin
router.post(
  '/',
  auth,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color hex'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { name, description, icon, color, order } = req.body;
      let slug = generateSlug(name);

      // Ensure unique slug
      const existing = await Category.findOne({ slug });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const category = await Category.create({
        name,
        slug,
        description,
        icon: icon || 'folder',
        color: color || '#22c55e',
        order: order || 0,
        createdBy: req.user._id,
      });

      res.status(201).json({ message: 'Category created.', category });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// PUT /api/categories/:id - Admin
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.name) {
      updates.slug = generateSlug(updates.name);
    }
    delete updates.createdBy;

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    res.json({ message: 'Category updated.', category });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/categories/:id - Admin
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    res.json({ message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
