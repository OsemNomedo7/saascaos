const Subscription = require('../models/Subscription');

const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Admins bypass subscription check
    if (req.user.role === 'admin') {
      return next();
    }

    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({
        message: 'Active subscription required to access this content.',
        code: 'NO_SUBSCRIPTION',
      });
    }

    // Check expiration for non-lifetime plans
    if (subscription.plan !== 'lifetime' && subscription.endDate) {
      if (new Date() > subscription.endDate) {
        subscription.status = 'expired';
        await subscription.save();
        return res.status(403).json({
          message: 'Your subscription has expired. Please renew to continue.',
          code: 'SUBSCRIPTION_EXPIRED',
        });
      }
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({ message: 'Server error checking subscription.' });
  }
};

module.exports = requireSubscription;
