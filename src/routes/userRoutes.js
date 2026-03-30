const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

router.get('/profile', auth, (req, res) => {
  // Si llega aquí, es porque el token es válido
  // req.user contiene los datos que guardamos en el JWT (id)
  res.json({ message: "Bienvenido a tu perfil", userId: req.user.id });
});

module.exports = router;