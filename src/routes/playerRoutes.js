const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const playerController = require('../controllers/playerController');

router.use(authMiddleware);

router.get('/characters', playerController.getCharacters);
router.get('/inventory', playerController.getInventory);
router.post('/gacha/pull', playerController.gachaPull);

// Debug routes — disabled in production
if (process.env.NODE_ENV !== 'production') {
  router.post('/debug/cristales', playerController.debugAddCristales);
  router.post('/debug/reset-cristales', playerController.debugResetCristales);
  router.post('/debug/unlock-all', playerController.debugUnlockAll);
}

module.exports = router;
