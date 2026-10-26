const express = require('express');
const router = express.Router();
const {
  createToken,
  getTokenById,
  getMyTokens,
  cancelToken
} = require('../controllers/tokenController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.post('/', optionalProtect, createToken);
router.get('/customer/me', protect, getMyTokens);
router.get('/:id', getTokenById);
router.get('/:id/status', getTokenById);
router.delete('/:id', protect, cancelToken);

module.exports = router;
