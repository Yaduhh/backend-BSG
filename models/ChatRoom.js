const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  user1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  user2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  last_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  last_message_time: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  unread_count_user1: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  unread_count_user2: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  user1_unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  user2_unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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
  tableName: 'chat_rooms',
  timestamps: false,
});

// Define associations
ChatRoom.associate = (models) => {
  ChatRoom.belongsTo(models.User, { as: 'user1', foreignKey: 'user1_id' });
  ChatRoom.belongsTo(models.User, { as: 'user2', foreignKey: 'user2_id' });
  ChatRoom.hasMany(models.Message, { foreignKey: 'room_id', sourceKey: 'room_id' });
};

module.exports = ChatRoom; 