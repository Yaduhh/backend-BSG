const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DataAset = sequelize.define('DataAset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nama_aset: {
    type: DataTypes.STRING(255),
    allowNull: true, // Untuk properti
    comment: 'Nama aset untuk kategori PROPERTI'
  },
  merk_kendaraan: {
    type: DataTypes.STRING(255),
    allowNull: true, // Untuk kendaraan
    comment: 'Merk kendaraan untuk kategori KENDARAAN'
  },
  nama_barang: {
    type: DataTypes.STRING(255),
    allowNull: true, // Untuk elektronik
    comment: 'Nama barang untuk kategori ELEKTRONIK'
  },
  kategori: {
    type: DataTypes.ENUM('PROPERTI', 'KENDARAAN_PRIBADI', 'KENDARAAN_OPERASIONAL', 'KENDARAAN_DISTRIBUSI', 'ELEKTRONIK'),
    allowNull: false
  },
  no_sertifikat: {
    type: DataTypes.STRING(100),
    allowNull: true, // Untuk properti
    comment: 'Nomor sertifikat untuk properti'
  },
  lokasi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  atas_nama: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  data_pembelian: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tahun pembelian atau data pembelian'
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Status aset (DIJAMINKAN, DIMILIKI SENDIRI, AKTIF, dll)'
  },
  data_pbb: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Data PBB untuk properti'
  },
  plat_nomor: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Plat nomor untuk kendaraan'
  },
  nomor_mesin: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nomor mesin untuk kendaraan'
  },
  nomor_rangka: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nomor rangka untuk kendaraan'
  },
  pajak_berlaku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Pajak berlaku untuk kendaraan'
  },
  stnk_berlaku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'STNK berlaku untuk kendaraan'
  },
  estimasi_pembayaran_pajak: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Estimasi pembayaran pajak untuk kendaraan'
  },
  terakhir_service: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Terakhir service untuk kendaraan'
  },
  jadwal_service_berikutnya: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Jadwal service berikutnya untuk kendaraan'
  },
  asuransi_pakai: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'YA/TIDAK untuk asuransi kendaraan'
  },
  jenis_asuransi: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'TLO/ALL RISK untuk kendaraan'
  },
  asuransi_berlaku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Asuransi berlaku untuk kendaraan'
  },
  penanggung_jawab: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  merk: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Merk untuk elektronik'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Model untuk elektronik'
  },
  serial_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Serial number untuk elektronik'
  },
  tahun_pembelian: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Tahun pembelian untuk elektronik'
  },
  lampiran: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'FOTO, FILE, VIDEO'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'data_aset',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: (dataAset) => {
      // Validasi berdasarkan kategori
      if (dataAset.kategori === 'PROPERTI') {
        if (!dataAset.nama_aset) {
          throw new Error('Nama aset wajib diisi untuk kategori PROPERTI');
        }
      } else if (dataAset.kategori.includes('KENDARAAN')) {
        if (!dataAset.merk_kendaraan) {
          throw new Error('Merk kendaraan wajib diisi untuk kategori KENDARAAN');
        }
      } else if (dataAset.kategori === 'ELEKTRONIK') {
        if (!dataAset.nama_barang) {
          throw new Error('Nama barang wajib diisi untuk kategori ELEKTRONIK');
        }
      }
    },
    beforeUpdate: (dataAset) => {
      // Validasi berdasarkan kategori
      if (dataAset.kategori === 'PROPERTI') {
        if (!dataAset.nama_aset) {
          throw new Error('Nama aset wajib diisi untuk kategori PROPERTI');
        }
      } else if (dataAset.kategori.includes('KENDARAAN')) {
        if (!dataAset.merk_kendaraan) {
          throw new Error('Merk kendaraan wajib diisi untuk kategori KENDARAAN');
        }
      } else if (dataAset.kategori === 'ELEKTRONIK') {
        if (!dataAset.nama_barang) {
          throw new Error('Nama barang wajib diisi untuk kategori ELEKTRONIK');
        }
      }
    }
  }
});

// Instance method untuk mendapatkan nama aset berdasarkan kategori
DataAset.prototype.getNamaAset = function() {
  if (this.kategori === 'PROPERTI') {
    return this.nama_aset;
  } else if (this.kategori.includes('KENDARAAN')) {
    return this.merk_kendaraan;
  } else if (this.kategori === 'ELEKTRONIK') {
    return this.nama_barang;
  }
  return null;
};

// Association function
DataAset.associate = (models) => {
  DataAset.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = DataAset;
