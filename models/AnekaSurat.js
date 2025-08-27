const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AnekaSurat = sequelize.define('AnekaSurat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  jenis_dokumen: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  judul_dokumen: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lampiran: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
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
  tableName: 'aneka_surat',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['jenis_dokumen']
    },
    {
      fields: ['status_deleted']
    },
    {
      fields: ['id_user']
    }
  ]
});

// Static methods for backward compatibility
AnekaSurat.getAll = async function() {
  const results = await sequelize.query(
    `SELECT a.*, u.nama as user_nama 
     FROM aneka_surat a 
     LEFT JOIN users u ON a.id_user = u.id 
     WHERE a.status_deleted = 0 
     ORDER BY a.created_at DESC`,
    { type: sequelize.QueryTypes.SELECT }
  );
  return results;
};

AnekaSurat.getById = async function(id) {
  const results = await sequelize.query(
    `SELECT a.*, u.nama as user_nama 
     FROM aneka_surat a 
     LEFT JOIN users u ON a.id_user = u.id 
     WHERE a.id = ? AND a.status_deleted = 0`,
    { 
      replacements: [id],
      type: sequelize.QueryTypes.SELECT 
    }
  );
  return results[0] || null;
};

AnekaSurat.getByType = async function(type) {
  const results = await sequelize.query(
    `SELECT a.*, u.nama as user_nama 
     FROM aneka_surat a 
     LEFT JOIN users u ON a.id_user = u.id 
     WHERE a.jenis_dokumen = ? AND a.status_deleted = 0 
     ORDER BY a.created_at DESC`,
    { 
      replacements: [type],
      type: sequelize.QueryTypes.SELECT 
    }
  );
  return results;
};

AnekaSurat.create = async function(data) {
  const result = await sequelize.query(
    `INSERT INTO aneka_surat 
     (jenis_dokumen, judul_dokumen, lampiran, id_user, created_at, updated_at) 
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    {
      replacements: [
        data.jenis_dokumen,
        data.judul_dokumen,
        data.lampiran,
        data.id_user,
      ],
      type: sequelize.QueryTypes.INSERT
    }
  );
  return result[0];
};

AnekaSurat.update = async function(id, data) {
  const result = await sequelize.query(
    `UPDATE aneka_surat 
     SET jenis_dokumen = ?, judul_dokumen = ?, lampiran = ?, updated_at = NOW() 
     WHERE id = ? AND status_deleted = 0`,
    {
      replacements: [
        data.jenis_dokumen,
        data.judul_dokumen,
        data.lampiran,
        id,
      ],
      type: sequelize.QueryTypes.UPDATE
    }
  );
  return result[1] > 0;
};

AnekaSurat.delete = async function(id) {
  const result = await sequelize.query(
    `UPDATE aneka_surat 
     SET status_deleted = 1, updated_at = NOW() 
     WHERE id = ?`,
    {
      replacements: [id],
      type: sequelize.QueryTypes.UPDATE
    }
  );
  return result[1] > 0;
};

AnekaSurat.getDocumentTypes = async function() {
  const results = await sequelize.query(
    `SELECT DISTINCT jenis_dokumen, COUNT(*) as total 
     FROM aneka_surat 
     WHERE status_deleted = 0 
     GROUP BY jenis_dokumen`,
    { type: sequelize.QueryTypes.SELECT }
  );
  return results;
};

module.exports = AnekaSurat;
