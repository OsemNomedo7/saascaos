const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: String,
      default: 'global',
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ room: 1, createdAt: -1 });

// After saving a message, keep only last 200 per room
messageSchema.post('save', async function () {
  try {
    const count = await mongoose.model('Message').countDocuments({ room: this.room });
    if (count > 200) {
      const oldest = await mongoose.model('Message')
        .find({ room: this.room })
        .sort({ createdAt: 1 })
        .limit(count - 200)
        .select('_id');
      const ids = oldest.map((m) => m._id);
      await mongoose.model('Message').deleteMany({ _id: { $in: ids } });
    }
  } catch (err) {
    console.error('Error trimming messages:', err.message);
  }
});

module.exports = mongoose.model('Message', messageSchema);
