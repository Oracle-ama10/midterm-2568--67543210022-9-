// src/data/repositories/bookRepository.js
const db = require('../database/connection');

class BookRepository {
    async findAll(status = null) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM books';
            let params = [];
            
            if (status) {
                sql += ' WHERE status = ?';
                params.push(status);
            }
            
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async create(bookData) {
        const { title, author, isbn } = bookData;
        
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)';
            
            db.run(sql, [title, author, isbn], function(err) {
                if (err) {
                    reject(err);
                } else {
                    db.get('SELECT * FROM books WHERE id = ?', [this.lastID], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }
            });
        });
    }

    // ให้นักศึกษาเขียนเอง (เขียนเสร็จสมบูรณ์ให้แล้ว)
    async update(id, bookData) {
        const { title, author, isbn } = bookData;
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE books SET title = ?, author = ?, isbn = ? WHERE id = ?';
            
            db.run(sql, [title, author, isbn, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                }
            });
        });
    }

    async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE books SET status = ? WHERE id = ?', 
                [status, id], 
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        });
                    }
                }
            );
        });
    }

    async delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
                if (err) reject(err);
                else resolve({ message: 'Book deleted successfully' });
            });
        });
    }
}

module.exports = new BookRepository();