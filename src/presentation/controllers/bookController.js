// src/presentation/controllers/bookController.js
const bookService = require('../../business/services/bookService');

class BookController {
    async getAllBooks(req, res, next) {
        try {
            const { status } = req.query;
            const result = await bookService.getAllBooks(status);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async getBookById(req, res, next) {
        try {
            const book = await bookService.getBookById(req.params.id);
            res.json(book);
        } catch (error) {
            next(error);
        }
    }

    async createBook(req, res, next) {
        try {
            const newBook = await bookService.createBook(req.body);
            res.status(201).json(newBook);
        } catch (error) {
            next(error);
        }
    }

    async updateBook(req, res, next) {
        try {
            const updatedBook = await bookService.updateBook(req.params.id, req.body);
            res.json(updatedBook);
        } catch (error) {
            next(error);
        }
    }

    async borrowBook(req, res, next) {
        try {
            const result = await bookService.borrowBook(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async returnBook(req, res, next) {
        try {
            const result = await bookService.returnBook(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async deleteBook(req, res, next) {
        try {
            const result = await bookService.deleteBook(req.params.id);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookController();