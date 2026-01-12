// src/presentation/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);
router.put('/:id', bookController.updateBook);
router.patch('/:id/borrow', bookController.borrowBook);
router.patch('/:id/return', bookController.returnBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;