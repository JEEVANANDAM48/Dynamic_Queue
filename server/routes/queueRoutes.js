const express = require('express');
const router = express.Router();
const {
  getActiveQueue,
  getQueueByService,
  getDisplayBoard
} = require('../controllers/queueController');

router.get('/display/:serviceCentreId', getDisplayBoard);
router.get('/:serviceCentreId', getActiveQueue);
router.get('/:serviceCentreId/:serviceId', getQueueByService);

module.exports = router;
