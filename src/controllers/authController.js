const { User, PlayerStats } = require('../models');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Crear usuario (el hash se hace en el modelo)
    const user = await User.create({ username, email, password });

    // Crear estadísticas iniciales para el juego automáticamente
    await PlayerStats.create({ 
      UserId: user.id,
      level: 1,
      gold: 100, // Regalo inicial
      elo_rating: 1000 
    });

    res.status(201).json({ message: "Usuario creado con éxito" });
  } catch (error) {
    res.status(400).json({ error: "El usuario o email ya existen" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identity, password } = req.body; // 'identity' puede ser username o email

    // Buscar por cualquiera de los dos
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [{ username: identity }, { email: identity }] 
      } 
    });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
};