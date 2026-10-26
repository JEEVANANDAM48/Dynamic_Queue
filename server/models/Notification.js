const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      default: null
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['WAIT_UPDATE', 'TOKEN_CALLED', 'SERVICE_STARTED', 'SERVICE_COMPLETED'], default: 'WAIT_UPDATE' },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
