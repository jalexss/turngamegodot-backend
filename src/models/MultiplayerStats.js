const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MultiplayerStats', {
    elo_rating: {
      type: DataTypes.INTEGER,
      defaultValue: 1000
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    win_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    best_win_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_matches: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
};
