// Backend Configuration Constants
require('dotenv').config();

const API_CONFIG = {
    // Base URLs
    BASE_URL: process.env.API_BASE_URL || 'http://192.168.30.21:3000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    PORT: process.env.PORT || 3000,

    // Database Configuration
    DATABASE: {
        HOST: process.env.DB_HOST || '192.168.38.223',
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'bosgil_group_db',
    },

    // JWT Configuration
    JWT: {
        SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    },

    // File Upload Configuration
    UPLOAD: {
        PATH: process.env.UPLOAD_PATH || './uploads',
        MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },

    // CORS Configuration
    CORS: {
        ORIGIN: process.env.FRONTEND_URL || 'http://192.168.38.223:5173',
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