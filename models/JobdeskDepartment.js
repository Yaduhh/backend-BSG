const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobdeskDepartment = sequelize.define('JobdeskDepartment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  divisi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID divisi',
    references: {
      model: 'jobdesk_divisi',
      key: 'id'
    }
  },
  nama_department: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama department'
  },
  keterangan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Keterangan department'
  },
  status_aktif: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Status aktif department'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID admin yang menginput',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang mengupdate',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'jobdesk_departments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['divisi_id']
    },
    {
      fields: ['nama_department']
    },
    {
      fields: ['status_aktif']
    },
    {
      fields: ['created_by']
    }
  ]
});

module.exports = JobdeskDepartment;
