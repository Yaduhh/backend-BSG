// Backend Configuration Constants
require('dotenv').config();

// Baca file .env secara manual untuk memastikan terbaca
const path = require('path');
const fs = require('fs');

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

// Environment variables loaded silently

const API_CONFIG = {
    // Base URLs - gunakan localhost untuk development
    BASE_URL: envConfig.API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000',
    FRONTEND_URL: envConfig.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
    PORT: envConfig.PORT || process.env.PORT || 3000,

    // Database Configuration
    DATABASE: {
        HOST: envConfig.DB_HOST || process.env.DB_HOST || 'localhost',
        USER: envConfig.DB_USER || process.env.DB_USER || 'root',
        PASSWORD: envConfig.DB_PASSWORD || process.env.DB_PASSWORD || '',
        NAME: envConfig.DB_NAME || process.env.DB_NAME || 'sistem_bosgil_group',
    },

    // JWT Configuration
    JWT: {
        SECRET: envConfig.JWT_SECRET || process.env.JWT_SECRET || 'bosgil_group',
        EXPIRES_IN: envConfig.JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '30d', // 30 hari
    },

    // File Upload Configuration
    UPLOAD: {
        PATH: envConfig.UPLOAD_PATH || process.env.UPLOAD_PATH || './uploads',
        MAX_FILE_SIZE: parseInt(envConfig.MAX_FILE_SIZE || process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },

    // CORS Configuration
    CORS: {
        ORIGIN: envConfig.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
        CREDENTIALS: true,
    },

    // API Routes
    ROUTES: {
        API_PREFIX: '/api',
        AUTH: '/auth',
        USERS: '/users',
        POSKAS: '/keuangan-poskas',
        TASKS: '/daftar-tugas',
        COMPLAINTS: '/daftar-komplain',
        ANNOUNCEMENTS: '/pengumuman',
        CHAT: '/chat',
        CHAT_GROUP: '/chat-group',
        UPLOAD: '/upload',
        HEALTH: '/health',
    },
};

// Configuration loaded silently

// Helper functions
const getDatabaseUrl = () => {
    const { HOST, USER, PASSWORD, NAME } = API_CONFIG.DATABASE;
    return `mysql://${USER}:${PASSWORD}@${HOST}/${NAME}`;
};

const getFullUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ROUTES.API_PREFIX}${endpoint}`;
};

const getUploadUrl = (filename, type = 'general') => {
    return `${API_CONFIG.BASE_URL}/uploads/${type}/${filename}`;
};

// Environment detection
const isDevelopment = () => process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = () => process.env.NODE_ENV === 'production';
const isStaging = () => process.env.NODE_ENV === 'staging';

module.exports = {
    API_CONFIG,
    getDatabaseUrl,
    getFullUrl,
    getUploadUrl,
    isDevelopment,
    isProduction,
    isStaging,
}; 