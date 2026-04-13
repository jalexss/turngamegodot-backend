const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const survivalController = require('../controllers/survivalController');

router.use(authMiddleware);

router.post('/start', survivalController.startRun);
router.put('/save', survivalController.saveProgress);
router.put('/end', survivalController.endRun);
router.get('/active', survivalController.getActiveRun);
router.get('/history', survivalController.getRunHistory);

module.exports = router;
