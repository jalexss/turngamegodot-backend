const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('StoryProgress', {
    current_episode: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    current_level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    completed_levels: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    characters: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  });
};
