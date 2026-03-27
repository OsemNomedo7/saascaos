const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
  },
  { timestamps: true }
);

// One review per user per content
reviewSchema.index({ content: 1, user: 1 }, { unique: true });
reviewSchema.index({ content: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
