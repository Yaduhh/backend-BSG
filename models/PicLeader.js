const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const PicLeader = sequelize.define('PicLeader', {
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
    comment: 'ID user leader yang bertanggung jawab'
  },
  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama menu/tanggung jawab leader'
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Link/navigasi untuk menu'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Status aktif menu'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Soft delete flag'
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
  tableName: 'pic_leader',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['id_user']
    },
    {
      fields: ['status_deleted']
    },
    {
      fields: ['status_aktif']
    },
  ]
});

// Define association with User model
PicLeader.belongsTo(User, {
  foreignKey: 'id_user',
  as: 'user'
});

User.hasMany(PicLeader, {
  foreignKey: 'id_user',
  as: 'picLeaders'
});

module.exports = PicLeader;
