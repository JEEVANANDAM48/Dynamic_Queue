const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema(
  {
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    counterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Counter',
      required: true
    },
    serviceCentreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCentre',
      required: true
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    actualDurationMinutes: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);
