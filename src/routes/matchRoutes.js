const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const matchController = require('../controllers/matchController');

router.use(authMiddleware);

router.get('/history', matchController.getHistory);
router.get('/stats', matchController.getStats);

module.exports = router;
