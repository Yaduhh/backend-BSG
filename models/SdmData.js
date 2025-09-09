const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SdmData = sequelize.define('SdmData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Data Personal
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama lengkap karyawan'
  },
  tempat_lahir: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Tempat lahir'
  },
  tanggal_lahir: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal lahir'
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Nomor HP'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Email karyawan'
  },
  media_sosial: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Media sosial'
  },
  
  // Data Keluarga
  nama_pasangan: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama pasangan'
  },
  nama_anak: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Nama anak-anak'
  },
  no_hp_pasangan: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Nomor HP pasangan'
  },
  kontak_darurat: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama dan HP kontak darurat'
  },
  
  // Data Alamat
  alamat_sekarang: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alamat tempat tinggal sekarang'
  },
  link_map_sekarang: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Link Google Map alamat sekarang'
  },
  alamat_asal: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alamat daerah asal'
  },
  link_map_asal: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Link Google Map alamat asal'
  },
  
  // Data Orang Tua
  nama_orang_tua: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nama orang tua'
  },
  alamat_orang_tua: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alamat orang tua'
  },
  link_map_orang_tua: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Link Google Map alamat orang tua'
  },
  
  // Data Kerja
  jabatan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sdm_jabatan',
      key: 'id'
    },
    comment: 'ID jabatan'
  },
  tanggal_bergabung: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal bergabung'
  },
  lama_bekerja: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Lama bekerja'
  },
  
  // Data Training
  training_dasar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Training dasar'
  },
  training_skillo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Training skillo'
  },
  training_leadership: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Training leadership'
  },
  training_lanjutan: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Training lanjutan'
  },
  
  // Data Gaji
  gaji_pokok: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Gaji pokok'
  },
  tunjangan_kinerja: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Tunjangan kinerja'
  },
  tunjangan_posisi: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Tunjangan posisi'
  },
  uang_makan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Uang makan'
  },
  lembur: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Lembur'
  },
  bonus: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Bonus'
  },
  total_gaji: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total gaji'
  },
  potongan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Potongan'
  },
  bpjstk: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'BPJSTK'
  },
  bpjs_kesehatan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'BPJS Kesehatan'
  },
  bpjs_kes_penambahan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'BPJS Kesehatan penambahan'
  },
  sp_1_2: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'SP 1/2'
  },
  pinjaman_karyawan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Pinjaman karyawan'
  },
  pph21: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'PPH21'
  },
  total_potongan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total potongan'
  },
  total_gaji_dibayarkan: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Total gaji yang dibayarkan'
  },
  
  // Relasi ke User
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user account'
  },
  
  // Audit
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID admin yang menginput'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID admin yang mengupdate'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Status soft delete data SDM'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp ketika data SDM dihapus'
  },
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang menghapus data SDM'
  }
}, {
  tableName: 'sdm_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama']
    },
    {
      fields: ['jabatan_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['status_deleted']
    },
    {
      fields: ['deleted_at']
    }
  ]
});

SdmData.associate = (models) => {
  SdmData.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  SdmData.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  SdmData.belongsTo(models.User, {
    foreignKey: 'deleted_by',
    as: 'deleter'
  });

  SdmData.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  SdmData.belongsTo(models.SdmJabatan, {
    foreignKey: 'jabatan_id',
    as: 'jabatan'
  });
};

module.exports = SdmData;
