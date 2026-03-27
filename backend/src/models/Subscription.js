const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['weekly', 'monthly', 'lifetime'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    gateway: {
      type: String,
      enum: ['stripe', 'mercadopago', 'manual'],
      default: 'manual',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast user lookups
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

// Virtual: isExpired
subscriptionSchema.virtual('isExpired').get(function () {
  if (this.plan === 'lifetime') return false;
  if (!this.endDate) return true;
  return new Date() > this.endDate;
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
