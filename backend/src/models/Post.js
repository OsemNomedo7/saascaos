const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    subtitle: {
      type: String,
      default: null,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
      trim: true,
    },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video', null], default: null },
    mediaFileName: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ isActive: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
