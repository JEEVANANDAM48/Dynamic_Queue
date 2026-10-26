const express = require('express');
const router = express.Router();
const {
  getStaffQueueState,
  callNextToken,
  startService,
  completeService,
  markNoShow,
  skipToken,
  recallToken
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('STAFF', 'ADMIN'));

router.get('/queue-state', getStaffQueueState);
router.post('/call-next', callNextToken);
router.post('/tokens/:id/call', callNextToken);
router.post('/service/start', startService);
router.post('/service/complete', completeService);
router.post('/tokens/:id/no-show', markNoShow);
router.post('/tokens/:id/skip', skipToken);
router.post('/tokens/:id/recall', recallToken);

module.exports = router;
