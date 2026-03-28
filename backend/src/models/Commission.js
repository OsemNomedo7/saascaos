const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema(
  {
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },
    plan: {
      type: String,
      enum: ['weekly', 'monthly', 'lifetime'],
      required: true,
    },
    saleAmount: {
      type: Number,
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true, // percentual ex: 30 = 30%
    },
    commissionAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

commissionSchema.index({ affiliate: 1, status: 1 });
commissionSchema.index({ referredUser: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
