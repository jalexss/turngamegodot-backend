const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PlayerStats', {
    level: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1 
    },
    total_runs_survival: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    best_floor_survival: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    total_episodes_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_time_played_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
};