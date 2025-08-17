const express = require('express');
const corsMiddleware = require('./cors');
const errorHandler = require('./errorHandler');

const setupMiddleware = (app) => {
  // CORS middleware
  app.use(corsMiddleware);
  
  // Body parsing middleware with increased limits for rich content
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Error handling middleware (harus di akhir)
  app.use(errorHandler);
};

module.exports = setupMiddleware; 