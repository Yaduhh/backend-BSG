const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const SdmDivisi = require('./SdmDivisi');

const LeaderDivisi = sequelize.define('LeaderDivisi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID user leader'
  },
  id_divisi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sdm_divisi',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID divisi'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Status aktif relasi'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID user yang membuat relasi'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID user yang update relasi'
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
  tableName: 'leader_divisi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['id_user']
    },
    {
      fields: ['id_divisi']
    },
    {
      fields: ['status_aktif']
    },
    {
      unique: true,
      fields: ['id_user', 'id_divisi']
    }
  ]
});

// Associations are defined in models/index.js

module.exports = LeaderDivisi;
