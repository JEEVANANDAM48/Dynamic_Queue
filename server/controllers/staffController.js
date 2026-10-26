const mongoose = require('mongoose');
const Token = require('../models/Token');
const Counter = require('../models/Counter');
const ServiceRecord = require('../models/ServiceRecord');
const Notification = require('../models/Notification');
const { recalculateQueueForServiceCentre } = require('../services/queueEstimationService');
const { getIO } = require('../sockets/socketHandler');

const getHelperIO = () => {
  try { return getIO(); } catch (e) { return null; }
};

// @desc    Get staff dashboard queue state
// @route   GET /api/staff/queue-state
// @access  Private (Staff)
const getStaffQueueState = async (req, res) => {
  try {
    const counterId = req.user.counterId || req.query.counterId;
    if (!counterId) {
      return res.status(400).json({ success: false, message: 'No counter assigned to staff user' });
    }

    if (!mongoose.Types.ObjectId.isValid(counterId)) {
      return res.status(400).json({ success: false, message: 'Invalid counter ID format' });
    }

    const counter = await Counter.findById(counterId)
      .populate('serviceCentreId')
      .populate('supportedServices');

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Assigned counter not found' });
    }

    let currentToken = null;
    if (counter.currentTokenId) {
      currentToken = await Token.findById(counter.currentTokenId)
        .populate('serviceId', 'name code defaultDurationMinutes')
        .populate('customerId', 'name email');
    }

    // Fetch waiting tokens for supported services at this service centre
    let waitingTokens = await Token.find({
      serviceCentreId: counter.serviceCentreId._id,
      serviceId: { $in: counter.supportedServices },
      status: 'WAITING'
    })
      .sort({ createdAt: 1 })
      .populate('serviceId', 'name code')
      .populate('customerId', 'name');

    // If counter has 0 tokens for its specific services, check all waiting tokens at this centre
    if (waitingTokens.length === 0) {
      waitingTokens = await Token.find({
        serviceCentreId: counter.serviceCentreId._id,
        status: 'WAITING'
      })
        .sort({ createdAt: 1 })
        .populate('serviceId', 'name code')
        .populate('customerId', 'name');
    }

    res.json({
      success: true,
      data: {
        counter,
        currentToken,
        waitingTokens,
        waitingCount: waitingTokens.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Call next token in queue
// @route   POST /api/tokens/:id/call or POST /api/staff/call-next
// @access  Private (Staff)
const callNextToken = async (req, res) => {
  try {
    const counterId = req.user.counterId || req.body.counterId;
    if (!counterId) {
      return res.status(400).json({ success: false, message: 'Counter ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(counterId)) {
      return res.status(400).json({ success: false, message: 'Invalid counter ID format' });
    }

    const counter = await Counter.findById(counterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    // If specific token ID provided, call that; otherwise call next WAITING token
    let token;
    if (req.params.id) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Invalid token ID format' });
      }
      token = await Token.findById(req.params.id);
    } else {
      token = await Token.findOne({
        serviceCentreId: counter.serviceCentreId,
        serviceId: { $in: counter.supportedServices },
        status: 'WAITING'
      }).sort({ createdAt: 1 });

      // Fallback: If no tokens in counter's specific services, pick the oldest waiting token at this centre
      if (!token) {
        token = await Token.findOne({
          serviceCentreId: counter.serviceCentreId,
          status: 'WAITING'
        }).sort({ createdAt: 1 });
      }
    }

    if (!token) {
      return res.status(404).json({ success: false, message: 'No waiting tokens available in queue' });
    }

    token.status = 'CALLED';
    token.counterId = counter._id;
    token.calledAt = new Date();
    await token.save();

    counter.currentTokenId = token._id;
    await counter.save();

    const io = getHelperIO();
    if (io) {
      io.to(`serviceCentre:${counter.serviceCentreId}`).emit('tokenCalled', {
        tokenNumber: token.tokenNumber,
        counterNumber: counter.counterNumber,
        tokenId: token._id,
        serviceCentreId: counter.serviceCentreId
      });
    }

    await recalculateQueueForServiceCentre(counter.serviceCentreId, io);

    res.json({ success: true, message: `Token ${token.tokenNumber} called`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start service for current called token
// @route   POST /api/service/start
// @access  Private (Staff)
const startService = async (req, res) => {
  try {
    const tokenId = req.body.tokenId || req.body.id;

    if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ success: false, message: 'A valid tokenId is required' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'CALLED' && token.status !== 'WAITING') {
      return res.status(400).json({ success: false, message: `Cannot start service for token in ${token.status} status` });
    }

    const serverStartTime = new Date();
    token.status = 'SERVING';
    token.serviceStartTime = serverStartTime;
    await token.save();

    const io = getHelperIO();
    if (io) {
      io.to(`token:${token._id}`).emit('serviceStarted', {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        startTime: serverStartTime
      });
      io.to(`serviceCentre:${token.serviceCentreId}`).emit('serviceStarted', {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        startTime: serverStartTime
      });
    }

    await recalculateQueueForServiceCentre(token.serviceCentreId, io);

    res.json({
      success: true,
      message: `Service started for ${token.tokenNumber}`,
      data: {
        token,
        serverStartTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete service & record actual duration
// @route   POST /api/service/complete
// @access  Private (Staff)
const completeService = async (req, res) => {
  try {
    const tokenId = req.body.tokenId || req.body.id;

    if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
      return res.status(400).json({ success: false, message: 'A valid tokenId is required' });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'SERVING') {
      return res.status(400).json({ success: false, message: 'Service must be started before completing' });
    }

    const serverEndTime = new Date();
    const startTime = token.serviceStartTime || new Date(serverEndTime - 10 * 60 * 1000);

    // Calculate actual service duration in minutes
    const durationMs = serverEndTime.getTime() - new Date(startTime).getTime();
    const actualServiceDuration = Math.max(0.1, Math.round((durationMs / (1000 * 60)) * 100) / 100);

    token.status = 'COMPLETED';
    token.serviceEndTime = serverEndTime;
    token.actualServiceDuration = actualServiceDuration;
    await token.save();

    // Create ServiceRecord historical entry
    await ServiceRecord.create({
      tokenId: token._id,
      serviceId: token.serviceId,
      counterId: token.counterId || req.user.counterId,
      serviceCentreId: token.serviceCentreId,
      startTime: startTime,
      endTime: serverEndTime,
      actualDurationMinutes: actualServiceDuration
    });

    // Clear active token on counter
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, { currentTokenId: null });
    }

    const io = getHelperIO();
    if (io) {
      io.to(`token:${token._id}`).emit('serviceCompleted', {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        actualServiceDuration
      });
      io.to(`serviceCentre:${token.serviceCentreId}`).emit('serviceCompleted', {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        actualServiceDuration
      });
      io.to(`serviceCentre:${token.serviceCentreId}`).emit('queueUpdated', {
        serviceCentreId: token.serviceCentreId,
        timestamp: new Date()
      });
    }

    // Trigger dynamic queue recalculation with new historical duration data!
    await recalculateQueueForServiceCentre(token.serviceCentreId, io);

    res.json({
      success: true,
      message: `Service completed for ${token.tokenNumber}`,
      data: {
        token,
        actualServiceDuration
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark token as No-Show
// @route   POST /api/tokens/:id/no-show
// @access  Private (Staff)
const markNoShow = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid token ID format' });
    }

    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    token.status = 'NO_SHOW';
    await token.save();

    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, { currentTokenId: null });
    }

    const io = getHelperIO();
    await recalculateQueueForServiceCentre(token.serviceCentreId, io);

    res.json({ success: true, message: `Token ${token.tokenNumber} marked as No-Show`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Skip token
// @route   POST /api/tokens/:id/skip
// @access  Private (Staff)
const skipToken = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid token ID format' });
    }

    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Move to end of queue or keep as WAITING
    token.status = 'WAITING';
    token.createdAt = new Date(); // Reset timestamp so it moves behind
    await token.save();

    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, { currentTokenId: null });
    }

    const io = getHelperIO();
    await recalculateQueueForServiceCentre(token.serviceCentreId, io);

    res.json({ success: true, message: `Token ${token.tokenNumber} skipped and re-queued`, data: token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recall token (re-announce)
// @route   POST /api/tokens/:id/recall
// @access  Private (Staff)
const recallToken = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid token ID format' });
    }

    const token = await Token.findById(req.params.id).populate('counterId');
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const io = getHelperIO();
    if (io) {
      io.to(`serviceCentre:${token.serviceCentreId}`).emit('tokenCalled', {
        tokenNumber: token.tokenNumber,
        counterNumber: token.counterId ? token.counterId.counterNumber : 'Counter',
        tokenId: token._id,
        isRecall: true
      });
    }

    res.json({ success: true, message: `Token ${token.tokenNumber} recalled successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStaffQueueState,
  callNextToken,
  startService,
  completeService,
  markNoShow,
  skipToken,
  recallToken
};
