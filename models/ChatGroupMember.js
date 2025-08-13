const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatGroupMember = sequelize.define('ChatGroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  group_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'chat_groups',
      key: 'group_id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'group_members',
  timestamps: false,
});

module.exports = ChatGroupMember;
