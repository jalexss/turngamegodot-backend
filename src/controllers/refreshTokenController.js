const jwt = require('jsonwebtoken');

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token requerido" });
    }

    // Verificar el refreshToken
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Refresh token inválido o expirado" });
      }

      // Generar nuevo accessToken
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Opcionalmente, también generar nuevo refreshToken (más seguro)
      const newRefreshToken = jwt.sign(
        { id: decoded.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        msg: "Token refrescado",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: "Error al refrescar token" });
  }
};
