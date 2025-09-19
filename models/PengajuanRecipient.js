const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PengajuanRecipient = sequelize.define('PengajuanRecipient', {
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
  recipient_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  recipient_username: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  tableName: 'pengajuan_recipients',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PengajuanRecipient;
