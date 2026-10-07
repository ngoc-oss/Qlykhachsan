const xuLyLoi = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi server'
  });
};

module.exports = { xuLyLoi };

