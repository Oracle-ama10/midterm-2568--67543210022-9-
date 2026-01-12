// src/presentation/middlewares/errorHandler.js
function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);
    
    // กำหนด Status Code ตามประเภท Error
    let statusCode = 500;
    if (err.message.includes('not found')) statusCode = 404;
    if (err.message.includes('required') || err.message.includes('Invalid')) statusCode = 400;
    if (err.message.includes('already exists')) statusCode = 409;
    if (err.message.includes('borrowed')) statusCode = 400;

    res.status(statusCode).json({
        error: err.message || 'Internal server error'
    });
}

module.exports = errorHandler;