const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserNotification = sequelize.define('UserNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  notification_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'notifications',
      key: 'id'
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
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  device_token: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Firebase device token for push notification'
  },
  push_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  push_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  push_failed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  push_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if push notification failed'
  }
}, {
  tableName: 'user_notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['notification_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['user_id', 'is_read']
    },
    {
      unique: true,
      fields: ['notification_id', 'user_id']
    }
  ]
});

// Association function
UserNotification.associate = (models) => {
  UserNotification.belongsTo(models.Notification, {
    foreignKey: 'notification_id',
    as: 'notification'
  });
  
  UserNotification.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = UserNotification;
