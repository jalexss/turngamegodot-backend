const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const refreshTokenController = require('../controllers/refreshTokenController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', refreshTokenController.refresh);

// Nueva ruta para GodotSteam
router.post('/steam-login', authController.steamLogin);

module.exports = router;