const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SopStep = sequelize.define('SopStep', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID kategori SOP',
    references: {
      model: 'sop_categories',
      key: 'id'
    }
  },
  step_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Nomor urutan langkah'
  },
  deskripsi_step: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Deskripsi langkah'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan tambahan langkah'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif langkah'
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
  tableName: 'sop_steps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['step_number']
    },
    {
      fields: ['status_aktif']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = SopStep;
