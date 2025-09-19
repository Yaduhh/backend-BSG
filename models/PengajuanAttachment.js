const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PengajuanAttachment = sequelize.define('PengajuanAttachment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  pengajuan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('image', 'video', 'file', 'text'),
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'for text type attachment',
  },
}, {
  tableName: 'pengajuan_attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PengajuanAttachment;
