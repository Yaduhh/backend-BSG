const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Model untuk tabel KPIs
const KPI = sequelize.define('KPI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  category: {
    type: DataTypes.ENUM('divisi', 'leader', 'individu'),
    allowNull: false,
    validate: {
      isIn: [['divisi', 'leader', 'individu']]
    }
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'kpis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category']
    }
  ]
});

module.exports = {
  KPI
};
