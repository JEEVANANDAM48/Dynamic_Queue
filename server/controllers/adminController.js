const User = require('../models/User');
const ServiceCentre = require('../models/ServiceCentre');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Token = require('../models/Token');
const ServiceRecord = require('../models/ServiceRecord');
const bcrypt = require('bcryptjs');

// @desc    Get system analytics summary
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalActiveTokens = await Token.countDocuments({
      status: { $in: ['WAITING', 'CALLED', 'SERVING'] }
    });

    const waitingCustomers = await Token.countDocuments({ status: 'WAITING' });
    const servingCustomers = await Token.countDocuments({ status: 'SERVING' });
    const completedToday = await Token.countDocuments({
      status: 'COMPLETED',
      updatedAt: { $gte: startOfDay }
    });
    const cancelledToday = await Token.countDocuments({
      status: 'CANCELLED',
      updatedAt: { $gte: startOfDay }
    });

    // Calculate average service duration today
    const recordsToday = await ServiceRecord.find({ createdAt: { $gte: startOfDay } });
    let avgServiceTimeMinutes = 0;
    if (recordsToday.length > 0) {
      const sum = recordsToday.reduce((acc, curr) => acc + curr.actualDurationMinutes, 0);
      avgServiceTimeMinutes = Math.round((sum / recordsToday.length) * 10) / 10;
    } else {
      avgServiceTimeMinutes = 10; // Default
    }

    res.json({
      success: true,
      data: {
        totalActiveTokens,
        waitingCustomers,
        servingCustomers,
        completedToday,
        cancelledToday,
        avgServiceTimeMinutes,
        totalCentres: await ServiceCentre.countDocuments(),
        totalServices: await Service.countDocuments(),
        totalCounters: await Counter.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get users list
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('serviceCentreId', 'name code')
      .populate('counterId', 'counterNumber');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create staff user
// @route   POST /api/admin/staff
// @access  Private (Admin)
const createStaff = async (req, res) => {
  try {
    const { name, email, password, serviceCentreId, counterId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const staff = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'STAFF',
      serviceCentreId: serviceCentreId || null,
      counterId: counterId || null
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Service Centre Management
const getServiceCentres = async (req, res) => {
  try {
    const centres = await ServiceCentre.find();
    res.json({ success: true, data: centres });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createServiceCentre = async (req, res) => {
  try {
    const { name, code, address } = req.body;
    const centre = await ServiceCentre.create({ name, code, address });
    res.status(201).json({ success: true, data: centre });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Services Management
const getServices = async (req, res) => {
  try {
    const services = await Service.find().populate('serviceCentreId', 'name code');
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const { name, code, description, defaultDurationMinutes, serviceCentreId } = req.body;
    const service = await Service.create({
      name,
      code,
      description,
      defaultDurationMinutes: defaultDurationMinutes || 10,
      serviceCentreId
    });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Counter Management
const getCounters = async (req, res) => {
  try {
    const counters = await Counter.find()
      .populate('serviceCentreId', 'name code')
      .populate('supportedServices', 'name code')
      .populate('currentStaffId', 'name email');
    res.json({ success: true, data: counters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCounter = async (req, res) => {
  try {
    const { counterNumber, serviceCentreId, supportedServices } = req.body;
    const counter = await Counter.create({
      counterNumber,
      serviceCentreId,
      supportedServices: supportedServices || []
    });
    res.status(201).json({ success: true, data: counter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCounter = async (req, res) => {
  try {
    const counter = await Counter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: counter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Service Records & Logs
const getServiceRecords = async (req, res) => {
  try {
    const records = await ServiceRecord.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('tokenId', 'tokenNumber customerName')
      .populate('serviceId', 'name code')
      .populate('counterId', 'counterNumber')
      .populate('serviceCentreId', 'name');

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { seedDemoData } = require('../services/seedService');

// Seed Demo Environment
const seedDemo = async (req, res) => {
  try {
    const result = await seedDemoData(req.body && req.body.forceReset === true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  createStaff,
  getServiceCentres,
  createServiceCentre,
  getServices,
  createService,
  updateService,
  getCounters,
  createCounter,
  updateCounter,
  getServiceRecords,
  seedDemo
};
