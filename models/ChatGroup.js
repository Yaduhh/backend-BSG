const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatGroup = sequelize.define('ChatGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  group_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  group_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  group_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'chat_groups',
  timestamps: false,
});

module.exports = ChatGroup;
