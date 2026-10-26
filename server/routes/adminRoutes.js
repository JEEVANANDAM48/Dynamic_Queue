const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public read endpoints (used by Mobile Customer App and Kiosk)
router.get('/service-centres', getServiceCentres);
router.get('/services', getServices);
router.get('/counters', getCounters);

// Admin-only management endpoints
router.use(protect);
router.use(authorize('ADMIN'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/staff', createStaff);

router.post('/service-centres', createServiceCentre);
router.post('/services', createService);
router.put('/services/:id', updateService);

router.post('/counters', createCounter);
router.put('/counters/:id', updateCounter);

router.get('/service-records', getServiceRecords);
router.post('/seed-demo', seedDemo);

module.exports = router;
