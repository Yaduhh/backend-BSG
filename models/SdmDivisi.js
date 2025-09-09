const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SdmDivisi = sequelize.define('SdmDivisi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_divisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama divisi/cabang'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan divisi'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif divisi'
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
    comment: 'Status soft delete divisi'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp ketika divisi dihapus'
  },
  deleted_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang menghapus divisi'
  }
}, {
  tableName: 'sdm_divisi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama_divisi']
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

SdmDivisi.associate = (models) => {
  SdmDivisi.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  SdmDivisi.belongsTo(models.User, {
    foreignKey: 'updated_by',
    as: 'updater'
  });

  SdmDivisi.belongsTo(models.User, {
    foreignKey: 'deleted_by',
    as: 'deleter'
  });

  SdmDivisi.hasMany(models.SdmJabatan, {
    foreignKey: 'divisi_id',
    as: 'jabatans'
  });
};

module.exports = SdmDivisi;
