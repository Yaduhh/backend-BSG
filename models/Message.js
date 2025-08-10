const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'file'),
    defaultValue: 'text',
  },
  is_group_message: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  status_deleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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
  tableName: 'messages',
  timestamps: false,
});

// Define associations
Message.associate = (models) => {
  Message.belongsTo(models.User, { as: 'sender', foreignKey: 'sender_id' });
  // Note: Removed ChatRoom association to avoid foreign key constraint issues
  // Group messages don't need to reference chat_rooms table
};

module.exports = Message; 