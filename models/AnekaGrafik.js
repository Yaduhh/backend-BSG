const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Model untuk tabel AnekaGrafik
const AnekaGrafik = sequelize.define('AnekaGrafik', {
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
    type: DataTypes.ENUM('omzet', 'bahan_baku', 'gaji_bonus_ops', 'gaji', 'bonus', 'operasional'),
    allowNull: false,
    validate: {
      isIn: [['omzet', 'bahan_baku', 'gaji_bonus_ops', 'gaji', 'bonus', 'operasional']]
    }
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'aneka_grafik',
      key: 'id'
    }
  },
  photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'aneka_grafik',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['status_deleted']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = {
  AnekaGrafik
}; 