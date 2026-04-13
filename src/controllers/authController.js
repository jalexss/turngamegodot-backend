const { User, PlayerStats, PlayerCharacter, PlayerInventory } = require('../models');
const jwt = require('jsonwebtoken');

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
      defaults: { username }
    });

    if (created) {
      await PlayerStats.create({
        UserId: user.id,
        level: 1
      });
      await PlayerInventory.create({
        UserId: user.id,
        cristales: 100
      });
      await PlayerCharacter.create({
        UserId: user.id,
        character_id: 4,
        is_starter: true
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const userWithData = await User.findByPk(user.id, {
      include: [PlayerStats, PlayerInventory, PlayerCharacter]
    });

    return res.json({
      msg: created ? "Usuario creado por Steam" : "Login exitoso",
      accessToken,
      refreshToken,
      user: {
        id: userWithData.id,
        steam_id: userWithData.steam_id,
        username: userWithData.username,
        stats: userWithData.PlayerStat,
        inventory: userWithData.PlayerInventory,
        characters: userWithData.PlayerCharacters
      }
    });

  } catch (error) {
    console.error('Steam Login error:', error);
    return res.status(500).json({ error: "Error de conexión con Steam" });
  }
};