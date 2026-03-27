const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const Post = require('../models/Post');
const auth = require('../middlewares/auth');
const requireSubscription = require('../middlewares/subscription');

const LEVEL_ORDER = { iniciante: 0, intermediario: 1, avancado: 2, elite: 3 };

// GET /api/search
router.get('/search', auth, requireSubscription, async (req, res) => {
  try {
    const { q, category, type, level, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters.' });
    }

    const userLevelOrder = LEVEL_ORDER[req.user.level] || 0;
    const accessibleLevels = Object.keys(LEVEL_ORDER).filter(
      (l) => LEVEL_ORDER[l] <= userLevelOrder
    );

    const contentQuery = {
      isActive: true,
      minLevel: { $in: req.user.role === 'admin' ? Object.keys(LEVEL_ORDER) : accessibleLevels },
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    };

    if (category) contentQuery.category = category;
    if (type) contentQuery.type = type;
    if (level) contentQuery.minLevel = level;

    const postQuery = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ],
    };

    const sortObj = sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 };

    const [contents, posts, contentTotal, postTotal] = await Promise.all([
      Content.find(contentQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category', 'name slug color'),
      Post.find(postQuery).sort(sortObj).limit(5).populate('author', 'name avatar'),
      Content.countDocuments(contentQuery),
      Post.countDocuments(postQuery),
    ]);

    res.json({
      query: q,
      results: {
        content: {
          items: contents,
          total: contentTotal,
        },
        posts: {
          items: posts,
          total: postTotal,
        },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(contentTotal / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed.' });
  }
});

module.exports = router;
