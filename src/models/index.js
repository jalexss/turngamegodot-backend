const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

// Importamos las funciones de los modelos
const UserFactory = require('./User');
const PlayerStatsFactory = require('./PlayerStats');
const PlayerCharacterFactory = require('./PlayerCharacter');
const PlayerInventoryFactory = require('./PlayerInventory');
const GachaHistoryFactory = require('./GachaHistory');
const MatchHistoryFactory = require('./MatchHistory');
const SurvivalRunFactory = require('./SurvivalRun');
const StoryProgressFactory = require('./StoryProgress');
const MultiplayerStatsFactory = require('./MultiplayerStats');

// Inicializamos los modelos
const User = UserFactory(sequelize);
const PlayerStats = PlayerStatsFactory(sequelize);
const PlayerCharacter = PlayerCharacterFactory(sequelize);
const PlayerInventory = PlayerInventoryFactory(sequelize);
const GachaHistory = GachaHistoryFactory(sequelize);
const MatchHistory = MatchHistoryFactory(sequelize);
const SurvivalRun = SurvivalRunFactory(sequelize);
const StoryProgress = StoryProgressFactory(sequelize);
const MultiplayerStats = MultiplayerStatsFactory(sequelize);

// --- DEFINIR RELACIONES ---
// Perfil del jugador (1:1)
User.hasOne(PlayerStats, { onDelete: 'CASCADE' });
PlayerStats.belongsTo(User);

// Personajes desbloqueados (1:N)
User.hasMany(PlayerCharacter, { onDelete: 'CASCADE' });
PlayerCharacter.belongsTo(User);

// Inventario / cristales (1:1)
User.hasOne(PlayerInventory, { onDelete: 'CASCADE' });
PlayerInventory.belongsTo(User);

// Historial de gacha (1:N)
User.hasMany(GachaHistory, { onDelete: 'CASCADE' });
GachaHistory.belongsTo(User);

// Historial de partidas universal (1:N)
User.hasMany(MatchHistory, { onDelete: 'CASCADE' });
MatchHistory.belongsTo(User);

// Runs de supervivencia (1:N)
User.hasMany(SurvivalRun, { onDelete: 'CASCADE' });
SurvivalRun.belongsTo(User);

// Progreso de historia (1:1)
User.hasOne(StoryProgress, { onDelete: 'CASCADE' });
StoryProgress.belongsTo(User);

// Stats de multijugador (1:1)
User.hasOne(MultiplayerStats, { onDelete: 'CASCADE' });
MultiplayerStats.belongsTo(User);

module.exports = {
  sequelize,
  User,
  PlayerStats,
  PlayerCharacter,
  PlayerInventory,
  GachaHistory,
  MatchHistory,
  SurvivalRun,
  StoryProgress,
  MultiplayerStats
};