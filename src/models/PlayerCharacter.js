const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('PlayerCharacter', {
    character_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unlocked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    is_starter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'character_id']
      }
    ]
  });
};
