const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const requireSubscription = require('../middlewares/subscription');
const { addXp } = require('../utils/xp');
const { processImageUpload, processFileUpload } = require('../config/storage');

// multer para mídia do chat (25 MB)
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// multer para mídia de posts (100 MB — suporta vídeos)
const postUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// GET /api/community/posts
router.get('/posts', auth, requireSubscription, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'name avatar level role')
        .populate('category', 'name slug color'),
      Post.countDocuments(query),
    ]);

    res.json({
      posts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/community/posts/:id
router.get('/posts/:id', auth, requireSubscription, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar level role')
      .populate('category', 'name slug color');

    if (!post || !post.isActive) return res.status(404).json({ message: 'Post not found.' });

    post.views += 1;
    await post.save();

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/posts
router.post(
  '/posts',
  auth,
  requireSubscription,
  [
    body('title').trim().notEmpty().withMessage('Título obrigatório').isLength({ max: 200 }),
    body('content').trim().notEmpty().withMessage('Conteúdo obrigatório').isLength({ max: 10000 }),
    body('subtitle').optional().isLength({ max: 300 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { title, subtitle, content, category, mediaUrl, mediaType, mediaFileName } = req.body;
      const post = await Post.create({
        title,
        subtitle: subtitle || null,
        content,
        category: category || null,
        author: req.user._id,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        mediaFileName: mediaFileName || null,
      });
      await post.populate('author', 'name avatar level role');
      addXp(req.user._id, 'post').catch(() => {});
      res.status(201).json({ message: 'Post criado.', post });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// POST /api/community/posts/upload — upload de mídia para posts
router.post('/posts/upload', auth, requireSubscription, (req, res, next) => {
  postUpload.single('media')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Arquivo muito grande. Limite: 100 MB.' });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

    const mediaType = req.body.type || 'image';
    let url;

    if (mediaType === 'image') {
      url = await processImageUpload(req.file);
    } else {
      url = await processFileUpload(req.file);
    }

    res.json({
      url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      mediaType,
    });
  } catch (err) {
    console.error('[posts/upload]', err);
    res.status(500).json({ message: 'Falha no upload da mídia.' });
  }
});

// PUT /api/community/posts/:id
router.put('/posts/:id', auth, requireSubscription, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) return res.status(404).json({ message: 'Post not found.' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { title, content } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    await post.save();

    res.json({ message: 'Post updated.', post });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/community/posts/:id
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    post.isActive = false;
    await post.save();
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', auth, requireSubscription, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) return res.status(404).json({ message: 'Post not found.' });

    const userId = req.user._id;
    const idx = post.likes.indexOf(userId);
    if (idx === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(idx, 1);
    }
    await post.save();

    res.json({ message: 'Like toggled.', likes: post.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/posts/:id/pin - Admin
router.post('/posts/:id/pin', auth, admin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ message: `Post ${post.isPinned ? 'pinned' : 'unpinned'}.`, isPinned: post.isPinned });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', auth, requireSubscription, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isActive: true })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatar level role');
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/posts/:id/comments
router.post(
  '/posts/:id/comments',
  auth,
  requireSubscription,
  [body('content').trim().notEmpty().withMessage('Comment required').isLength({ max: 2000 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post || !post.isActive) return res.status(404).json({ message: 'Post not found.' });

      const comment = await Comment.create({
        content: req.body.content,
        author: req.user._id,
        post: post._id,
      });

      post.commentCount += 1;
      await post.save();

      addXp(req.user._id, 'comment').catch(() => {});

      await comment.populate('author', 'name avatar level role');
      res.status(201).json({ message: 'Comment added.', comment });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/community/comments/:id
router.delete('/comments/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    comment.isActive = false;
    await comment.save();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/comments/:id/like
router.post('/comments/:id/like', auth, requireSubscription, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment || !comment.isActive) return res.status(404).json({ message: 'Comment not found.' });

    const userId = req.user._id;
    const idx = comment.likes.indexOf(userId);
    if (idx === -1) {
      comment.likes.push(userId);
    } else {
      comment.likes.splice(idx, 1);
    }
    await comment.save();

    res.json({ message: 'Like toggled.', likes: comment.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/community/chat/upload — upload de mídia para o chat (imagens, áudio, arquivos)
router.post('/chat/upload', auth, (req, res, next) => {
  chatUpload.single('media')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Arquivo muito grande. Limite: 25 MB para mídia no chat.' });
    }
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });

    const mediaType = req.body.type || 'file'; // 'image' | 'file' | 'audio'
    let url;

    if (mediaType === 'image') {
      url = await processImageUpload(req.file);
    } else {
      url = await processFileUpload(req.file);
    }

    res.json({
      url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error('[chat/upload]', err);
    res.status(500).json({ message: 'Falha no upload da mídia.' });
  }
});

module.exports = router;
