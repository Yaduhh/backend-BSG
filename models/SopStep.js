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
  judul_procedure: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Judul prosedur/langkah'
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
  tableName: 'sop_procedures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category_id']
    },
    {
      fields: ['judul_procedure']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = SopStep;
