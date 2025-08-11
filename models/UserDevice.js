const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserDevice = sequelize.define('UserDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  device_id: {
    type: DataTypes.STRING(191), // Reduced from 255 to 191 to avoid key length issues
    allowNull: false,
    comment: 'Unique device identifier (e.g., Device.osInternalBuildId)'
  },
  expo_token: {
    type: DataTypes.STRING(255),
    allowNull: true, // Changed to true to allow null values
    comment: 'Expo push notification token'
  },
  device_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Device name (e.g., iPhone 12, Samsung Galaxy)'
  },
  platform: {
    type: DataTypes.ENUM('ios', 'android'),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_online: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time user was online (disconnected)'
  }
}, {
  tableName: 'user_devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'device_id'],
      name: 'unique_user_device'
    },
    {
      fields: ['expo_token'],
      name: 'idx_expo_token'
    },
    {
      fields: ['is_active'],
      name: 'idx_is_active'
    }
  ]
});

// Association function
UserDevice.associate = (models) => {
  UserDevice.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = UserDevice; 