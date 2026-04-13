const { User, PlayerStats } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// No necesitas 'require' para fetch en Node v22
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const APP_ID = process.env.STEAM_APP_ID || "480";

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

exports.steamLogin = async (req, res) => {
  try {
    const { ticket, steamId, username } = req.body;

    if (!ticket || !steamId || !username) {
      return res.status(400).json({ error: "Faltan parámetros de autenticación" });
    }

    const steamVerifyUrl = `https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1/?key=${STEAM_API_KEY}&appid=${APP_ID}&ticket=${encodeURIComponent(ticket)}`;

    const response = await fetch(steamVerifyUrl);
    const data = await response.json();

    const result = data?.response?.params?.result || data?.response?.error || null;
    if (!response.ok || result !== "OK") {
      console.warn("Steam ticket validation failed", data);
      return res.status(401).json({ error: "Ticket de Steam inválido" });
    }

    const [user, created] = await User.findOrCreate({
      where: { steam_id: steamId },
      defaults: { username, email: null, password: null }
    });

    if (created) {
      await PlayerStats.create({
        UserId: user.id,
        level: 1,
        gold: 100,
        elo_rating: 1000
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const userWithStats = await User.findByPk(user.id, { include: [PlayerStats] });

    return res.json({
      msg: created ? "Usuario creado por Steam" : "Login exitoso",
      accessToken,
      refreshToken,
      user: {
        id: userWithStats.id,
        steam_id: userWithStats.steam_id,
        username: userWithStats.username,
        email: userWithStats.email,
        stats: userWithStats.PlayerStats
      }
    });

  } catch (error) {
    console.error('Steam Login error:', error);
    return res.status(500).json({ error: "Error de conexión con Steam" });
  }
};

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

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      msg: "Usuario creado con éxito",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
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
      },
      include: [PlayerStats] // Traemos las stats de una vez
    });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      msg: "Success",
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        stats: user.PlayerStats // Aquí Godot recibe nivel, oro, etc.
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};