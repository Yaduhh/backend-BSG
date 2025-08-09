const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimMerah = sequelize.define('TimMerah', {
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
  status: {
    type: DataTypes.ENUM('SP1', 'SP2', 'SP3'),
    allowNull: false,
    comment: 'Status peringatan'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan pelanggaran'
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
  tableName: 'tim_merah',
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
      fields: ['status']
    },

    {
      fields: ['created_by']
    }
  ]
});

TimMerah.associate = (models) => {
  TimMerah.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = TimMerah;
