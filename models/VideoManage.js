const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VideoManage = sequelize.define('VideoManage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role: {
    type: DataTypes.ENUM('admin', 'leader'),
    allowNull: false,
    comment: 'Target role yang menggunakan video ini'
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Relative path di folder uploads'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Penanda video aktif untuk role tersebut'
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID yang mengunggah video'
  }
}, {
  tableName: 'video_manage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = VideoManage;
