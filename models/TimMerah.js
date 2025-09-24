const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimMerah = sequelize.define('TimMerah', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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

  // Relasi ke user pegawai yang menjadi anggota tim merah
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user pegawai yang masuk tim merah'
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
      fields: ['status']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['user_id']
    }
  ]
});

TimMerah.associate = (models) => {
  TimMerah.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  // Pegawai yang menjadi anggota tim merah
  TimMerah.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'employee'
  });
};

module.exports = TimMerah;
