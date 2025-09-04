const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DataBinaLingkungan = sequelize.define('DataBinaLingkungan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  lokasi: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  jabatan: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  alamat: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nominal: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // JSON array berisi objek lampiran: { url, originalName, filename, mimetype, size, path }
  lampiran: {
    type: DataTypes.TEXT, // simpan sebagai JSON string
    allowNull: true,
    get() {
      const raw = this.getDataValue('lampiran');
      if (!raw) return [];
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    },
    set(val) {
      if (!val) {
        this.setDataValue('lampiran', null);
        return;
      }
      try {
        this.setDataValue('lampiran', JSON.stringify(val));
      } catch (e) {
        this.setDataValue('lampiran', null);
      }
    }
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'data_bina_lingkungan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['lokasi']
    },
    {
      fields: ['status_deleted']
    }
  ]
});

module.exports = DataBinaLingkungan;
