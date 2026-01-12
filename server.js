// server.js - Layered Architecture Entry Point
const express = require('express');
const bookRoutes = require('./src/presentation/routes/bookRoutes');
const errorHandler = require('./src/presentation/middlewares/errorHandler');

const app = express();

// Middleware พื้นฐาน
app.use(express.json());
app.use(express.static('public'));

// 🚀 Routes (เปลี่ยนมาเรียกผ่าน Presentation Layer)
app.use('/api/books', bookRoutes);

// ⚠️ Error handling (ต้องอยู่ท้ายสุดหลังจากประกาศ Routes เสมอ)
app.use(errorHandler);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Library Management System (Layered Architecture) running on http://localhost:${PORT}`);
});