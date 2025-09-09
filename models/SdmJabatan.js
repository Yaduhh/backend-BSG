const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SdmJabatan = sequelize.define('SdmJabatan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_jabatan: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama jabatan/sub-divisi'
  },
  divisi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sdm_divisi',
      key: 'id'
    },
    comment: 'ID divisi'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan jabatan'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif jabatan'
  },
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
    comment: 'Status soft delete jabatan'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp ketika jabatan dihapus'
  },
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang menghapus jabatan'
  }
}, {
  tableName: 'sdm_jabatan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama_jabatan']
    },
    {
      fields: ['divisi_id']
    },
    {
      fields: ['status_aktif']
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

SdmJabatan.associate = (models) => {
  SdmJabatan.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  SdmJabatan.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  SdmJabatan.belongsTo(models.User, {
    foreignKey: 'deleted_by',
    as: 'deleter'
  });

  SdmJabatan.belongsTo(models.SdmDivisi, {
    foreignKey: 'divisi_id',
    as: 'divisi'
  });

  SdmJabatan.hasMany(models.SdmData, {
    foreignKey: 'jabatan_id',
    as: 'employees'
  });
};

module.exports = SdmJabatan;
