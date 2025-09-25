const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const TugasSaya = sequelize.define('TugasSaya', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tugas_saya: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Deskripsi tugas saya'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID user pembuat entri'
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Relasi ke tabel users'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'tugas_saya',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

TugasSaya.associate = (models) => {
  TugasSaya.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' })
  TugasSaya.belongsTo(models.User, { foreignKey: 'id_user', as: 'assignedUser' })
}

module.exports = TugasSaya
