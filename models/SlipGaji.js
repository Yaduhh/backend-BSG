const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SlipGaji = sequelize.define('SlipGaji', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID unik slip gaji'
    },
    lampiran_foto: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'URL foto slip gaji'
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Keterangan slip gaji'
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID user pemilik slip gaji',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Status soft delete'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Waktu dibuat'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID user yang membuat',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Waktu diupdate'
    }
  }, {
    tableName: 'slip_gaji',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['id_user']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['status_deleted']
      },
      {
        fields: ['created_at']
      }
    ],
    comment: 'Tabel slip gaji karyawan'
  });

module.exports = SlipGaji;
