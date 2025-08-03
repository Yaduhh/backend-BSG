const express = require('express');
const corsMiddleware = require('./cors');
const errorHandler = require('./errorHandler');

const setupMiddleware = (app) => {
  // CORS middleware
  app.use(corsMiddleware);
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Error handling middleware (harus di akhir)
  app.use(errorHandler);
};

module.exports = setupMiddleware; 