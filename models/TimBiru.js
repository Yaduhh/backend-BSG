const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimBiru = sequelize.define('TimBiru', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama karyawan'
  },
  divisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Divisi/cabang tempat kerja'
  },
  posisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Posisi/jabatan karyawan'
  },
  prestasi: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Prestasi yang diraih'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan tambahan'
  },

  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID admin yang menginput'
  }
}, {
  tableName: 'tim_biru',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['nama']
    },
    {
      fields: ['divisi']
    },

    {
      fields: ['created_by']
    }
  ]
});

TimBiru.associate = (models) => {
  TimBiru.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = TimBiru;
