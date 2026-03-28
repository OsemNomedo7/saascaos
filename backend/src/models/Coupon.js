const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: '' },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    planRestriction: {
      type: String,
      enum: ['weekly', 'monthly', 'lifetime', 'all'],
      default: 'all',
    },
    maxUses: { type: Number, default: null },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

couponSchema.virtual('usedCount').get(function () {
  return this.usedBy.length;
});

module.exports = mongoose.model('Coupon', couponSchema);
