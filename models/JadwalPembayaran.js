const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JadwalPembayaran = sequelize.define('JadwalPembayaran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nama_item: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  kategori: {
    type: DataTypes.ENUM(
      'pajak_kendaraan_pribadi',
      'pajak_kendaraan_operasional', 
      'pajak_kendaraan_distribusi',
      'asuransi_kendaraan_pribadi',
      'asuransi_kendaraan_operasional',
      'asuransi_kendaraan_distribusi',
      'service_kendaraan_pribadi',
      'service_kendaraan_operasional',
      'service_kendaraan_distribusi',
      'pbb_pribadi',
      'pbb_outlet',
      'angsuran_pribadi',
      'angsuran_usaha',
      'sewa_pribadi',
      'sewa_outlet'
    ),
    allowNull: false
  },
  pic_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Bisa kosong jika belum ada PIC
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tanggal_update: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  tanggal_jatuh_tempo: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Detail fields untuk sewa outlet
  outlet: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sewa: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  pemilik_sewa: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  no_kontak_pemilik_sewa: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  no_rekening: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Field untuk bulan
  bulan: {
    type: DataTypes.ENUM(
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ),
    allowNull: true
  },
  tahun: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: new Date().getFullYear()
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'jadwal_pembayaran',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Association function
JadwalPembayaran.associate = (models) => {
  JadwalPembayaran.belongsTo(models.User, {
    foreignKey: 'pic_id',
    as: 'pic',
    onDelete: 'SET NULL'
  });
};

module.exports = JadwalPembayaran;
