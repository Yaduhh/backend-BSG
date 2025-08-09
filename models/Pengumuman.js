const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pengumuman = sequelize.define('Pengumuman', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  judul: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Judul pengumuman'
  },
  konten: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Isi pengumuman'
  },
  penulis_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user yang membuat pengumuman (owner)'
  },
  status: {
    type: DataTypes.ENUM('aktif', 'non_aktif'),
    allowNull: false,
    defaultValue: 'aktif',
    comment: 'Status pengumuman'
  },
  prioritas: {
    type: DataTypes.ENUM('tinggi', 'sedang', 'rendah'),
    allowNull: false,
    defaultValue: 'sedang',
    comment: 'Prioritas pengumuman'
  },
  tanggal_berlaku_dari: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Tanggal mulai berlaku'
  },
  tanggal_berlaku_sampai: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal selesai berlaku (opsional)'
  }
}, {
  tableName: 'pengumuman',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Association function
Pengumuman.associate = (models) => {
  // Penulis pengumuman (owner)
  Pengumuman.belongsTo(models.User, {
    foreignKey: 'penulis_id',
    as: 'penulis'
  });
};

module.exports = Pengumuman;
