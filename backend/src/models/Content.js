const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    type: {
      type: String,
      enum: ['programa', 'database', 'material', 'esquema', 'video', 'outro'],
      required: true,
    },
    minLevel: {
      type: String,
      enum: ['iniciante', 'intermediario', 'avancado', 'elite'],
      default: 'iniciante',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileKey: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: null,
    },
    externalLink: {
      type: String,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDrop: {
      type: Boolean,
      default: false,
    },
    dropExpiresAt: {
      type: Date,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

contentSchema.index({ category: 1, isActive: 1 });
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ minLevel: 1 });
contentSchema.index({ isDrop: 1, dropExpiresAt: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Content', contentSchema);
