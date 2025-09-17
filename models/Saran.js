const { DataTypes, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Saran = sequelize.define('Saran', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  saran: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  deskripsi_saran: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  receive_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID user yang menerima saran'
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
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'saran',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Relationships
Saran.belongsTo(User, { foreignKey: 'created_by', as: 'user' });
Saran.belongsTo(User, { foreignKey: 'receive_id', as: 'receiver' });
User.hasMany(Saran, { foreignKey: 'created_by', as: 'saran' });
User.hasMany(Saran, { foreignKey: 'receive_id', as: 'receivedSaran' });

module.exports = Saran;
