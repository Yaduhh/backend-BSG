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

// Static method untuk mendapatkan statistik
AnekaGrafik.getStats = async function() {
  try {
    const totalCount = await this.count({
      where: { status_deleted: false }
    });

    const categoryStats = await this.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { status_deleted: false },
      group: ['category']
    });

    const recentItems = await this.findAll({
      where: { status_deleted: false },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    return {
      success: true,
      data: {
        total: totalCount,
        byCategory: categoryStats,
        recent: recentItems
      }
    };
  } catch (error) {
    console.error('Error in AnekaGrafik.getStats:', error);
    return {
      success: false,
      error: 'Gagal mengambil statistik aneka grafik'
    };
  }
};

module.exports = {
  AnekaGrafik
}; 