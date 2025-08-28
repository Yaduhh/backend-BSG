const mysql = require('mysql2/promise');
const path = require('path');

// Database configuration
function loadDatabaseConfig() {
    return {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'sistem_bosgil_group',
        port: 3306
    };
}

// Normalize photo URL to store server-relative '/uploads/...' paths in DB
function normalizePhotoUrl(photoUrl) {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('/uploads/')) return photoUrl;
    return `/uploads/${photoUrl}`;
}

// Get all aneka grafik with hierarchical structure
const getAllAnekaGrafik = async (req, res) => {
  let connection;
  try {
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);

    // Get parent categories first
    const [parentCategories] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE status_deleted = 0 AND parent_id IS NULL ORDER BY name ASC'
    );

    // Get child items for each parent
    const hierarchicalData = [];
    for (const parent of parentCategories) {
      const [children] = await connection.execute(
        'SELECT * FROM aneka_grafik WHERE status_deleted = 0 AND parent_id = ? ORDER BY name ASC',
        [parent.id]
      );

      hierarchicalData.push({
        ...parent,
        children: children
      });
    }

    res.json({
      success: true,
      data: hierarchicalData
    });
  } catch (error) {
    console.error('Error getting all aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get aneka grafik by category
const getAnekaGrafikByCategory = async (req, res) => {
  let connection;
  try {
    const { category } = req.params;
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);
    
    const [anekaGrafik] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE category = ? AND status_deleted = 0 ORDER BY created_at DESC',
      [category]
    );

    res.json({
      success: true,
      data: anekaGrafik
    });
  } catch (error) {
    console.error('Error getting aneka grafik by category:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get aneka grafik by ID
const getAnekaGrafikById = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE id = ? AND status_deleted = 0',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error getting aneka grafik by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Create new aneka grafik
const createAnekaGrafik = async (req, res) => {
  let connection;
  try {
    const { name, category, photo_url, parent_id } = req.body;
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);

    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan kategori harus diisi'
      });
    }

    const normalizedPhoto = normalizePhotoUrl(photo_url);
    const [result] = await connection.execute(
      'INSERT INTO aneka_grafik (name, category, photo_url, parent_id, status_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, 0, NOW(), NOW())',
      [name, category, normalizedPhoto, parent_id || null]
    );

    const [newRecord] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: newRecord[0],
      message: 'Aneka grafik berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Update aneka grafik
const updateAnekaGrafik = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, category, photo_url } = req.body;
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);

    // Check if exists
    const [existing] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE id = ? AND status_deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    // Update fields
    const normalizedPhoto = normalizePhotoUrl(photo_url);
    await connection.execute(
      'UPDATE aneka_grafik SET name = ?, category = ?, photo_url = ?, updated_at = NOW() WHERE id = ?',
      [name, category, normalizedPhoto, id]
    );

    const [updatedRecord] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedRecord[0],
      message: 'Aneka grafik berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Delete aneka grafik (soft delete)
const deleteAnekaGrafik = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);

    // Check if exists
    const [existing] = await connection.execute(
      'SELECT * FROM aneka_grafik WHERE id = ? AND status_deleted = 0',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aneka grafik tidak ditemukan'
      });
    }

    // Soft delete
    await connection.execute(
      'UPDATE aneka_grafik SET status_deleted = 1, updated_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Aneka grafik berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting aneka grafik:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Get statistics
const getStats = async (req, res) => {
  let connection;
  try {
    const dbConfig = loadDatabaseConfig();
    connection = await mysql.createConnection(dbConfig);

    // Get total count
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM aneka_grafik WHERE status_deleted = 0'
    );
    
    // Get count by category
    const [categoryResult] = await connection.execute(
      'SELECT category, COUNT(*) as count FROM aneka_grafik WHERE status_deleted = 0 GROUP BY category'
    );

    // Get recent items
    const [recentResult] = await connection.execute(
      'SELECT id, name, category, created_at FROM aneka_grafik WHERE status_deleted = 0 ORDER BY created_at DESC LIMIT 5'
    );

    const stats = {
      total: totalResult[0].total,
      byCategory: categoryResult.reduce((acc, item) => {
        acc[item.category] = item.count;
        return acc;
      }, {}),
      recent: recentResult
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting aneka grafik stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik aneka grafik'
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  getAllAnekaGrafik,
  getAnekaGrafikByCategory,
  getAnekaGrafikById,
  createAnekaGrafik,
  updateAnekaGrafik,
  deleteAnekaGrafik,
  getStats
};