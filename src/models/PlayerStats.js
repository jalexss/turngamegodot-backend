const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PlayerStats', {
    level: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1 
    },
    gold: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    },
    elo_rating: { 
      type: DataTypes.INTEGER, 
      defaultValue: 1000 
    },
    max_floor_reached: { 
      type: DataTypes.INTEGER, 
      defaultValue: 0 
    }
  });
};