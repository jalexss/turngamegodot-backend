const User = require('./User')(sequelize);
const PlayerStats = require('./PlayerStats')(sequelize);

User.hasOne(PlayerStats);
PlayerStats.belongsTo(User);

module.exports = { User, PlayerStats, sequelize };