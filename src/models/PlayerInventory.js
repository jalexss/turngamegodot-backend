const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PlayerInventory', {
    cristales: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: { min: 0 }
    }
  });
};
