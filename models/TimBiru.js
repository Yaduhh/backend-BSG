const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimBiru = sequelize.define('TimBiru', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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

  // Relasi ke user pegawai yang menjadi anggota tim biru
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID user pegawai yang masuk tim biru'
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
      fields: ['created_by']
    },
    {
      fields: ['user_id']
    }
  ]
});

TimBiru.associate = (models) => {
  TimBiru.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  // Pegawai yang menjadi anggota tim biru
  TimBiru.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'employee'
  });
};

module.exports = TimBiru;
