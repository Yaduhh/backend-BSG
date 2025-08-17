const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Baca file .env secara manual
const envPath = path.join(__dirname, '../.env');
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const cleanContent = envContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  cleanContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value !== undefined) {
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        envConfig[cleanKey] = cleanValue;
      }
    }
  });
}

const config = {
  host: envConfig.DB_HOST || '192.168.30.124',
  port: envConfig.DB_PORT || 3306,
  user: envConfig.DB_USER || 'root',
  password: envConfig.DB_PASSWORD || '',
  database: envConfig.DB_NAME || 'sistem_bosgil_group'
};

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bosgil_group');

    // Ambil user dari database menggunakan raw query
    const connection = await mysql.createConnection(config);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ? AND status_deleted = 0',
        [decoded.userId]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      const user = rows[0];

      // Tambahkan user ke request object
      req.user = user;
      next();
    } finally {
      await connection.end();
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token telah kadaluarsa'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada autentikasi'
    });
  }
};

// Middleware khusus untuk admin
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Hanya admin/owner yang diizinkan.'
        });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  authenticateAdmin
}; 