const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const refreshTokenController = require('../controllers/refreshTokenController');

router.post('/refresh', refreshTokenController.refresh);
router.post('/steam-login', authController.steamLogin);

module.exports = router;