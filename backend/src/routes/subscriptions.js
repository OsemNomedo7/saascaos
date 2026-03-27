const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Log = require('../models/Log');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');

const PLANS = {
  weekly: { name: 'Weekly', price: 9.99, duration: 7, currency: 'USD' },
  monthly: { name: 'Monthly', price: 29.99, duration: 30, currency: 'USD' },
  lifetime: { name: 'Lifetime', price: 99.99, duration: null, currency: 'USD' },
};

// GET /api/subscriptions/plans - Public
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// GET /api/subscriptions/my - Auth
router.get('/my', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: 'active',
    }).sort({ createdAt: -1 });

    const history = await Subscription.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ subscription, history });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/subscriptions/checkout - Create payment intent (simplified)
router.post('/checkout', auth, async (req, res) => {
  try {
    const { plan, gateway = 'stripe' } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan.' });
    }

    const planInfo = PLANS[plan];

    // Create pending subscription
    const endDate =
      plan === 'lifetime'
        ? null
        : new Date(Date.now() + planInfo.duration * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      user: req.user._id,
      plan,
      status: 'pending',
      amount: planInfo.price,
      currency: planInfo.currency,
      gateway,
      endDate,
    });

    // In production: create Stripe PaymentIntent or MercadoPago preference here
    // For demo: return the subscription with a mock payment URL
    res.json({
      message: 'Checkout created.',
      subscription,
      paymentUrl: `${process.env.FRONTEND_URL}/planos?checkout=${subscription._id}`,
      clientSecret: `mock_secret_${subscription._id}`,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/subscriptions/webhook - Payment confirmed
router.post('/webhook', async (req, res) => {
  try {
    const { subscriptionId, paymentId, gateway } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    const planInfo = PLANS[subscription.plan];
    const startDate = new Date();
    const endDate =
      subscription.plan === 'lifetime'
        ? null
        : new Date(startDate.getTime() + planInfo.duration * 24 * 60 * 60 * 1000);

    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.paymentId = paymentId;
    subscription.gateway = gateway || subscription.gateway;
    await subscription.save();

    await Log.create({
      user: subscription.user,
      action: 'subscribe',
      resourceId: subscription._id,
      resourceType: 'Subscription',
      metadata: { plan: subscription.plan, gateway },
    });

    res.json({ message: 'Subscription activated.' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/subscriptions/activate-manual - Admin manual activation
router.post('/activate-manual', auth, admin, async (req, res) => {
  try {
    const { userId, plan, days } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ message: 'userId and plan are required.' });
    }

    if (!PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan.' });
    }

    // Deactivate any existing active subscription
    await Subscription.updateMany({ user: userId, status: 'active' }, { status: 'cancelled' });

    const planInfo = PLANS[plan];
    const startDate = new Date();
    let endDate = null;

    if (plan !== 'lifetime') {
      const duration = days || planInfo.duration;
      endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    }

    const subscription = await Subscription.create({
      user: userId,
      plan,
      status: 'active',
      startDate,
      endDate,
      gateway: 'manual',
      amount: planInfo.price,
      metadata: { activatedBy: req.user._id, activatedAt: new Date() },
    });

    await Log.create({
      user: req.user._id,
      action: 'subscribe',
      resourceId: subscription._id,
      resourceType: 'Subscription',
      metadata: { targetUser: userId, plan, manual: true },
    });

    res.json({ message: 'Subscription activated manually.', subscription });
  } catch (error) {
    console.error('Manual activation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
