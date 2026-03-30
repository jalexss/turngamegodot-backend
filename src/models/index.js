const sequelize = require('../config/db'); // Importamos la instancia de conexión
const { DataTypes } = require('sequelize');

// Importamos las funciones de los modelos
const UserFactory = require('./User');
const PlayerStatsFactory = require('./PlayerStats');

// Inicializamos los modelos pasándoles la instancia de sequelize
const User = UserFactory(sequelize);
const PlayerStats = PlayerStatsFactory(sequelize);

// --- DEFINIR RELACIONES ---
// Un usuario tiene un set de estadísticas
User.hasOne(PlayerStats, { onDelete: 'CASCADE' });
PlayerStats.belongsTo(User);

module.exports = {
  sequelize,
  User,
  PlayerStats
};