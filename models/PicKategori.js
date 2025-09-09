const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PicKategori = sequelize.define('PicKategori', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  kategori: {
    type: DataTypes.ENUM(
      'pajak_kendaraan_pribadi', 'pajak_kendaraan_operasional', 'pajak_kendaraan_distribusi',
      'asuransi_kendaraan_pribadi', 'asuransi_kendaraan_operasional', 'asuransi_kendaraan_distribusi',
      'service_kendaraan_pribadi', 'service_kendaraan_operasional', 'service_kendaraan_distribusi',
      'pbb_pribadi', 'pbb_outlet',
      'angsuran_pribadi', 'angsuran_usaha',
      'sewa_pribadi', 'sewa_outlet'
    ),
    allowNull: false,
    unique: true
  },
  pic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'pic_kategori',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PicKategori;
