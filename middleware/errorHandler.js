// Error handling middleware untuk HTTP
const errorHandler = (err, req, res, next) => {
  console.error('❌ HTTP Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
};

module.exports = errorHandler; 