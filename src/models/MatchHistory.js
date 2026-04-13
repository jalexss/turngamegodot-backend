const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('MatchHistory', {
    game_mode: {
      type: DataTypes.ENUM('supervivencia', 'historia', 'multijugador'),
      allowNull: false
    },
    result: {
      type: DataTypes.ENUM('victory', 'defeat', 'abandoned'),
      allowNull: false
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    characters_used: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });
};
