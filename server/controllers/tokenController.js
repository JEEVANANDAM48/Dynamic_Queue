const Token = require('../models/Token');
const Service = require('../models/Service');
const ServiceCentre = require('../models/ServiceCentre');
const User = require('../models/User');
const { recalculateQueueForServiceCentre } = require('../services/queueEstimationService');
const { getIO } = require('../sockets/socketHandler');

// Helper to generate next sequential token number (e.g., A101, A102...)
const generateTokenNumber = async (serviceId) => {
  const service = await Service.findById(serviceId);
  const prefix = service ? (service.code || 'A') : 'A';

  // Find latest token with this prefix today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Token.countDocuments({
    serviceId,
    createdAt: { $gte: startOfDay }
  });

  const nextNum = 101 + countToday;
  return `${prefix}${nextNum}`;
};

// @desc    Generate a new queue token
// @route   POST /api/tokens
// @access  Private (Customer or Staff on behalf)
const createToken = async (req, res) => {
  try {
    const { serviceId, serviceCentreId, customerName } = req.body;

    if (!serviceId || !serviceCentreId) {
      return res.status(400).json({ success: false, message: 'serviceId and serviceCentreId are required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const serviceCentre = await ServiceCentre.findById(serviceCentreId);
    if (!serviceCentre) {
      return res.status(404).json({ success: false, message: 'Service Centre not found' });
    }

    let customerId = req.user ? req.user._id : req.body.customerId;
    if (!customerId) {
      const defaultUser = await User.findOne({ role: 'CUSTOMER' });
      customerId = defaultUser ? defaultUser._id : null;
    }
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer account reference required' });
    }

    const tokenNumber = await generateTokenNumber(serviceId);

    const newToken = await Token.create({
      tokenNumber,
      customerId,
      customerName: customerName || (req.user ? req.user.name : 'Customer'),
      serviceId,
      serviceCentreId,
      status: 'WAITING',
      queuePosition: 0,
      peopleAhead: 0,
      estimatedWaitMinutes: service.defaultDurationMinutes || 10
    });

    // Recalculate queue for all waiting tokens in this centre
    let io;
    try { io = getIO(); } catch (e) { io = null; }

    await recalculateQueueForServiceCentre(serviceCentreId, io);

    // Fetch updated token with calculated fields
    const updatedToken = await Token.findById(newToken._id)
      .populate('serviceId', 'name code defaultDurationMinutes')
      .populate('serviceCentreId', 'name code address');

    res.status(201).json({
      success: true,
      data: updatedToken
    });
  } catch (error) {
    console.error('[Create Token Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get details of a specific token
// @route   GET /api/tokens/:id
// @access  Public / Private
const getTokenById = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('serviceId', 'name code description')
      .populate('serviceCentreId', 'name code address')
      .populate('counterId', 'counterNumber status');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tokens for logged-in customer
// @route   GET /api/customers/me/tokens
// @access  Private (Customer)
const getMyTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ customerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('serviceId', 'name code')
      .populate('serviceCentreId', 'name code')
      .populate('counterId', 'counterNumber');

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a token
// @route   DELETE /api/tokens/:id
// @access  Private (Customer / Admin)
const cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status === 'COMPLETED' || token.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: `Token is already ${token.status}` });
    }

    token.status = 'CANCELLED';
    token.cancelledAt = new Date();
    await token.save();

    // Recalculate queue for remaining waiting tokens
    let io;
    try { io = getIO(); } catch (e) { io = null; }
    await recalculateQueueForServiceCentre(token.serviceCentreId, io);

    res.json({ success: true, message: 'Token cancelled successfully', data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createToken,
  getTokenById,
  getMyTokens,
  cancelToken
};
