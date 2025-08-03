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
    references: {
      model: 'chat_rooms',
      key: 'room_id'
    }
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
  Message.belongsTo(models.ChatRoom, { foreignKey: 'room_id', targetKey: 'room_id' });
};

module.exports = Message; 