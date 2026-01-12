// src/business/services/bookService.js
const bookRepository = require('../../data/repositories/bookRepository');
const bookValidator = require('../validators/bookValidator');

class BookService {
    // ดึงหนังสือทั้งหมดพร้อมคำนวณสถิติ
    async getAllBooks(status = null) {
        const books = await bookRepository.findAll(status);
        
        // Business logic: คำนวณสถิติ (available, borrowed, total)
        const available = books.filter(b => b.status === 'available').length;
        const borrowed = books.filter(b => b.status === 'borrowed').length;
        
        return {
            books,
            statistics: { available, borrowed, total: books.length }
        };
    }

    // ดึงหนังสือตาม ID
    async getBookById(id) {
        const numId = bookValidator.validateId(id);
        const book = await bookRepository.findById(numId);
        
        if (!book) {
            throw new Error('Book not found');
        }
        return book;
    }

    // เพิ่มหนังสือใหม่
    async createBook(bookData) {
        // 1. Validate ข้อมูลพื้นฐานและ ISBN format
        bookValidator.validateBookData(bookData);
        bookValidator.validateISBN(bookData.isbn);
        
        try {
            return await bookRepository.create(bookData);
        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                throw new Error('ISBN already exists');
            }
            throw error;
        }
    }

    // อัปเดตข้อมูลหนังสือ
    async updateBook(id, bookData) {
        const numId = bookValidator.validateId(id);
        bookValidator.validateBookData(bookData);
        bookValidator.validateISBN(bookData.isbn);
        
        const existingBook = await bookRepository.findById(numId);
        if (!existingBook) {
            throw new Error('Book not found');
        }

        try {
            return await bookRepository.update(numId, bookData);
        } catch (error) {
            if (error.message.includes('UNIQUE')) {
                throw new Error('ISBN already exists');
            }
            throw error;
        }
    }

    // ยืมหนังสือ
    async borrowBook(id) {
        const numId = bookValidator.validateId(id);
        const book = await this.getBookById(numId);
        
        // Business logic: ตรวจสอบว่าถูกยืมไปหรือยัง
        if (book.status === 'borrowed') {
            throw new Error('Book is already borrowed');
        }
        
        return await bookRepository.updateStatus(numId, 'borrowed');
    }

    // คืนหนังสือ
    async returnBook(id) {
        const numId = bookValidator.validateId(id);
        const book = await this.getBookById(numId);
        
        // Business logic: ตรวจสอบว่าสถานะเป็นยืมอยู่หรือไม่
        if (book.status !== 'borrowed') {
            throw new Error('Book is not borrowed');
        }
        
        return await bookRepository.updateStatus(numId, 'available');
    }

    // ลบหนังสือ
    async deleteBook(id) {
        const numId = bookValidator.validateId(id);
        const book = await this.getBookById(numId);
        
        // Business logic: ห้ามลบหนังสือที่ถูกยืมอยู่
        if (book.status === 'borrowed') {
            throw new Error('Cannot delete borrowed book');
        }
        
        return await bookRepository.delete(numId);
    }
}

module.exports = new BookService();