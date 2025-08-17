// Error handling middleware untuk HTTP
const errorHandler = (err, req, res, next) => {
  console.error('❌ HTTP Error:', err);
  
  // Handle specific error types
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request data is too large. Please reduce the size of your content or images.',
      details: {
        limit: err.limit,
        length: err.length,
        type: err.type
      }
    });
  }
  
  // Handle other errors
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
};

module.exports = errorHandler; 