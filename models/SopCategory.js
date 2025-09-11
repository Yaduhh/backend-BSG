const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SopCategory = sequelize.define('SopCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  divisi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID divisi',
    references: {
      model: 'sop_divisi',
      key: 'id'
    }
  },
  nama_category: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama kategori SOP'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan kategori'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif kategori'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID admin yang menginput',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang mengupdate',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'sop_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['divisi_id']
    },
    {
      fields: ['nama_category']
    },
    {
      fields: ['status_aktif']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = SopCategory;
