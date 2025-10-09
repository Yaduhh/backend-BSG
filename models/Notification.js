const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sender_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  sender_role: {
    type: DataTypes.ENUM('owner', 'admin', 'leader', 'divisi'),
    allowNull: false,
    defaultValue: 'owner'
  },
  
  // Target information
  target_type: {
    type: DataTypes.ENUM('all_users', 'specific_users', 'role_based'),
    allowNull: false,
    defaultValue: 'all_users'
  },
  target_users: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of user IDs for specific_users target type'
  },
  target_role: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Role name for role_based target type'
  },
  
  // Notification settings
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data for the notification'
  },
  
  // Status tracking
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'For scheduled notifications'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sent_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of users who received the notification'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['sender_id']
    },
    {
      fields: ['target_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Association function
Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'sender_id',
    as: 'sender'
  });
};

module.exports = Notification;
