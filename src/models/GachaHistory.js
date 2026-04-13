const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('GachaHistory', {
    character_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pull_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_pity: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
