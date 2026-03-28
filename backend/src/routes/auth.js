const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const { addXp } = require('../utils/xp');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    try {
      const { name, email, password, referralCode: refCode } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use.' });
      }

      // Gerar código de afiliado único
      const crypto = require('crypto');
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      // Verificar se veio de um link de afiliado
      let referredBy = null;
      if (refCode) {
        const affiliateUser = await User.findOne({ referralCode: refCode });
        if (affiliateUser) referredBy = affiliateUser._id;
      }

      const user = await User.create({ name, email, password, referralCode, referredBy });

      await Log.create({
        user: user._id,
        action: 'register',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { email },
      });

      addXp(user._id, 'register').catch(() => {});

      const token = generateToken(user._id);

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          level: user.level,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: `Account banned. Reason: ${user.banReason || 'Violation of terms'}` });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account deactivated.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // XP por login diário (não repetir no mesmo dia)
      const today = new Date().toDateString();
      const lastLoginDate = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      if (lastLoginDate !== today) {
        addXp(user._id, 'login').catch(() => {});
      }

      await Log.create({
        user: user._id,
        action: 'login',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const token = generateToken(user._id);

      res.json({
        message: 'Login successful.',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          level: user.level,
          avatar: user.avatar,
          bannerUrl: user.bannerUrl,
          bio: user.bio,
          socialLinks: user.socialLinks,
          xp: user.xp,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+xp +achievements +bio +socialLinks +bannerUrl');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
  try {
    await Log.create({
      user: req.user._id,
      action: 'logout',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during logout.' });
  }
});

module.exports = router;
