const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('SurvivalRun', {
    status: {
      type: DataTypes.ENUM('active', 'completed', 'abandoned'),
      defaultValue: 'active',
      allowNull: false
    },
    seed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    current_floor: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    current_branch: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    max_floor_reached: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    gold: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    characters: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    map_data: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    run_buffs: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    items: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    started_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });
};
