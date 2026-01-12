# Product Management System - Architecture

## C1: System Context Diagram

```
┌─────────────────────────────────────────────────────┐
│                    System User                      │
│             (บรรณารักษ์, สมาชิกห้องสมุด)                │
└────────────┬────────────────────────────────────────┘
             │ HTTP/JSON (CRUD & Borrow/Return Operations)
             ▼
┌─────────────────────────────────────────────────────┐
│             Library Management System               │
│  • จัดการข้อมูลหนังสือ (CRUD)                            │
│  • ประมวลผลการยืม-คืนหนังสือ                            │
│  • คำนวณสถิติสถานะหนังสือ (Available/Borrowed)         │
└────────────┬────────────────────────────────────────┘
             │ SQL Queries
             ▼
┌─────────────────────────────────────────────────────┐
│               SQLite Database                       │
│                (library.db)                         │
└─────────────────────────────────────────────────────┘
```

### Actors
- **System User**: บรรณารักษ์หรือผู้ดูแลระบบที่ทำหน้าที่จัดการหนังสือและรายการยืม-คืน

### System
- **Library Management System: ระบบจัดการห้องสมุด
  - จัดการข้อมูลหนังสือ (เพิ่ม/แก้ไข/ลบ)
  - ประมวลผล Logic การยืม (Borrow) และคืน (Return)
  - คำนวณสถิติจำนวนหนังสือทั้งหมดในระบบแยกตามสถานะ

### External Systems
- **SQLite Database**: ระบบจัดเก็บข้อมูลหนังสือแบบ Relational Database

---

## C2: Container Diagram - Layered Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
└────────────┬───────────────────────────────────────────────────┘
             │ HTTP/JSON
             ▼
╔════════════════════════════════════════════════════════════════╗
║                   LIBRARY MANAGEMENT SYSTEM                    ║
╠════════════════════════════════════════════════════════════════╣
║ ┌───────────────────────────────────────────────────────────┐  ║
║ │            📋 PRESENTATION LAYER                         │  ║
║ │ • Routes (bookRoutes.js)                                  │ ║
║ │ • Controllers (bookController.js)                         │ ║
║ │ • Middlewares (errorHandler.js)                           │ ║
║ └──────────────────────┬────────────────────────────────────┘ ║
║                        │                                      ║
║                        ▼                                      ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │            🧠 BUSINESS LOGIC LAYER                       │ ║
║ │ • Services (bookService.js)                               │ ║
║ │ • Validators (bookValidator.js)                           │ ║
║ │                                                           │ ║
║ │ Business Rules:                                           │ ║
║ │  ✓ ISBN ต้องถูกต้องตามรูปแบบ (978/979)                       │ ║
║ │  ✓ ห้ามลบหนังสือที่ถูกยืมอยู่ (Status: borrowed)                 │ ║
║ │  ✓ คำนวณ Statistics: { available, borrowed, total }      │ ║
║ └──────────────────────┬────────────────────────────────────┘ ║
║                        │                                      ║
║                        ▼                                      ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │            💾 DATA ACCESS LAYER                          │ ║
║ │ • Repositories (bookRepository.js)                        │ ║
║ │ • Database (connection.js)                                │ ║
║ │                                                           │ ║
║ │ Methods:                                                  │ ║
║ │  • findAll(status), findById(id)                          │ ║
║ │  • create(data), update(id, data)                         │ ║
║ │  • updateStatus(id, status), delete(id)                   │ ║
║ └──────────────────────┬────────────────────────────────────┘ ║
╚════════════════════════╪══════════════════════════════════════╝
                         │ SQL
                         ▼
              ┌─────────────────────────┐
              │    SQLite Database      │
              │      (library.db)       │
              │                         │
              │ Table: books            │
              │ - id, title, author     │
              │ - isbn (Unique)         │
              │ - status (available/..) │
              └─────────────────────────┘
```

---

## Layer Responsibilities

### 1. Presentation Layer
**หน้าที่:**
- รับ HTTP Request และส่ง Response กลับหา Client
- จัดการ Routing ของ API Endpoints
- ทำ Global Error Handling ผ่าน Middleware

**ไฟล์:**
- bookRoutes.js: กำหนดเส้นทาง API เช่น /api/books
- bookController.js: รับข้อมูลจาก Request และเรียกใช้ Service
- errorHandler.js: แปลง Error ที่เกิดขึ้นเป็น JSON Response

**ตัวอย่างโค้ด:**
```javascript
// Controller รับผิดชอบเรื่อง HTTP (req, res)
class BookController {
    constructor(bookService) {
        this.bookService = bookService;
    }

    // GET /api/books
    async getAllBooks(req, res) {
        try {
            const status = req.query.status; // รับ filter จาก URL
            const result = await this.bookService.getBooks(status);
            res.json(result); // ตอบกลับเป็น JSON ให้หน้า UI ไปแสดงผล
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // PATCH /api/books/:id/borrow
    async borrowBook(req, res) {
        try {
            const { id } = req.params;
            const updatedBook = await this.bookService.borrowBook(id);
            res.json(updatedBook);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = BookController;
```

**Methods:**
- getAllBooks(req, res, next): รับ Query String (ถ้ามี) ส่งให้ Service และส่งผลลัพธ์พร้อมสถิติกลับเป็น JSON
- getBookById(req, res, next): ดึง ID จาก Parameter และส่งข้อมูลหนังสือกลับไป (ส่ง 404 หากไม่พบ)
- createBook(req, res, next): รับ Body JSON เพื่อส่งไปสร้างหนังสือใหม่ (ส่ง 201 Created เมื่อสำเร็จ)
- updateBook(req, res, next): รับ ID และ Body เพื่อส่งไปแก้ไขข้อมูลหนังสือ
- borrowBook(req, res, next): รับ ID เพื่อทำรายการยืมหนังสือผ่าน Service
- returnBook(req, res, next): รับ ID เพื่อทำรายการคืนหนังสือผ่าน Service
- deleteBook(req, res, next): รับ ID เพื่อส่งคำสั่งลบ (จัดการ Error พิเศษหากหนังสือถูกยืมอยู่)

**ห้ามทำ:**
- ❌ ติดต่อฐานข้อมูลหรือเขียน SQL
- ❌ ตรวจสอบเงื่อนไขทางธุรกิจที่ซับซ้อน

---

### 2. Business Logic Layer
**หน้าที่:**
- ตรวจสอบความถูกต้องของข้อมูล (Validation)
- ประมวลผลกฎทางธุรกิจ (Business Rules)
- Calculations
- เรียก Repository
- คำนวณสถิติและเตรียมข้อมูลก่อนส่งกลับ

**ไฟล์:**
- bookService.js: รวม Logic การยืม-คืน และการคำนวณสถิติ
- bookValidator.js: ตรวจสอบความถูกต้องของ ID, ISBN และฟิลด์ต่างๆ

**ตัวอย่างโค้ด:**
```javascript
// Service รับผิดชอบเรื่อง Logic ของระบบห้องสมุด
class BookService {
    constructor(bookRepository) {
        this.bookRepository = bookRepository;
    }

    async getBooks(status) {
        // ประมวลผลข้อมูลหรือคำนวณสถิติก่อนส่งให้ Controller
        return await this.bookRepository.findAll(status);
    }

    async borrowBook(id) {
        const book = await this.bookRepository.findById(id);
        
        // กฎเหล็ก: ถ้าหนังสือไม่อยู่ จะยืมไม่ได้
        if (!book || book.status !== 'available') {
            throw new Error('หนังสือเล่มนี้ไม่ว่างให้ยืมครับ');
        }

        // ถ้าผ่านกฎ ให้สั่ง Repository ไปอัปเดตฐานข้อมูล
        return await this.bookRepository.updateStatus(id, 'borrowed');
    }
}

module.exports = BookService;
```

**Methods:**
- getAllBooks(status): เรียก Repository เพื่อเอาข้อมูลหนังสือ และ คำนวณสถิติ (Statistics) สรุปยอดรวมส่งกลับไปด้วย
- getBookById(id): ตรวจสอบความมีอยู่ของหนังสือผ่าน Repository
- addBook(bookData): เรียก Validator เพื่อตรวจสอบ ISBN และรูปแบบข้อมูลก่อนสั่ง Create
- updateBook(id, bookData): ตรวจสอบความถูกต้องของข้อมูลใหม่ก่อนสั่ง Update
- borrowBook(id): ตรวจสอบว่าหนังสือเล่มนั้นว่างหรือไม่ ก่อนสั่งเปลี่ยนสถานะเป็น borrowed
- returnbook(id): ตรวจสอบว่าหนังสือถูกยืมไปจริงหรือไม่ ก่อนสั่งเปลี่ยนสถานะเป็น available
- deleteBook(id): หัวใจสำคัญ – ตรวจสอบว่าถ้าหนังสือถูกยืมอยู่ (status === 'borrowed') จะไม่อนุญาตให้ลบเด็ดขาด

**Business Rules:**
- ISBN ต้องมีรูปแบบที่ถูกต้อง
- หนังสือที่จะยืมได้ต้องมีสถานะ available เท่านั้น
- ห้ามลบ หนังสือเล่มที่ถูกยืมอยู่ (borrowed) ออกจากระบบ

**ห้ามทำ:**
- ❌ เขียน SQL Query
- ❌ จัดการ HTTP

---

### 3. Data Access Layer
**หน้าที่:**
- ทำงานกับ SQLite Database โดยตรง
- ทำ CRUD Operations ผ่าน Repository Pattern
- จัดการการเชื่อมต่อ (Database Connection)

**ไฟล์:**
- bookRepository.js: รวมคำสั่ง SQL (INSERT, SELECT, UPDATE, DELETE)
- connection.js: สร้างและกำหนดค่าเริ่มต้นให้ฐานข้อมูล (Create Table)

**ตัวอย่างโค้ด:**
```javascript
// Repository รับผิดชอบเรื่องการจัดการ Database (SQL)
class BookRepository {
    constructor(db) {
        this.db = db;
    }

    async findAll(status) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM books';
            const params = [];

            if (status) {
                sql += ' WHERE status = ?';
                params.push(status);
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    async updateStatus(id, newStatus) {
        return new Promise((resolve, reject) => {
            const sql = 'UPDATE books SET status = ? WHERE id = ?';
            this.db.run(sql, [newStatus, id], function(err) {
                if (err) reject(err);
                resolve({ id, status: newStatus });
            });
        });
    }
}

module.exports = BookRepository;
```

**Methods:**
- findAll(status): ดึงข้อมูลหนังสือทั้งหมดจาก Database (รองรับการกรองด้วยสถานะ available หรือ borrowed)
- findById(id): ค้นหาหนังสือเล่มเดียวด้วย ID เพื่อตรวจสอบข้อมูลก่อนประมวลผล
- create(bookData): เพิ่มหนังสือเล่มใหม่ลงในตาราง books (รับข้อมูล title, author, isbn)
- update(id, bookData): แก้ไขข้อมูลพื้นฐานของหนังสือ (title, author, isbn)
- updateStatus(id, status): อัปเดตเฉพาะสถานะการยืม-คืน (available / borrowed)
- delete(id): ลบหนังสือออกจากฐานข้อมูล

**ห้ามทำ:**
- ❌ Business Logic
- ❌ Validation

---

## Data Flow: Borrow Book

```
┌──────────────────────────────────────────────────────────────┐
│ 1. CLIENT (Frontend / Postman)                               │
│    PATCH /api/books/101/borrow                               │
│    Content-Type: application/json                            │
│    { "userId": "user_01" }                                   │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. PRESENTATION LAYER (Controller)                           │
│                                                              │
│    Routes (bookRoutes.js)                                    │
│    ├─ router.patch('/:id/borrow', controller.borrow)         │
│    │                                                         │
│    Controller (bookController.js)                            │
│    ├─ const { id } = req.params;                             │
│    └─ Call: bookService.borrowBook(id)                       │
└────────────┬─────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BUSINESS LOGIC LAYER (Service)                           │
│                                                             │
│    Service (bookService.js)                                 │
│    ├─ borrowBook(bookId)                                    │
│    │                                                        │
│    ├─ 🔍 Step 1: Get current book status from Repository    │
│    │                                                        │
│    ├─ ✅ Step 2: Validate Business Rules                    │
│    │    - If book.status !== 'available'                    │
│    │    - Throw Error: "หนังสือไม่ว่าง"                         │
│    │                                                        │
│    └─ 🚀 Step 3: Call: bookRepository.updateStatus(id, 'out')│
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DATA ACCESS LAYER (Repository)                           │
│                                                              │
│    Repository (bookRepository.js)                            │
│    ├─ updateStatus(id, newStatus)                            │
│    ├─ 🖥️ Execute SQL:                                        │
│    │    UPDATE books SET status = 'out' WHERE id = 101       │
│    │                                                         │
│    └─ Return: { id: 101, status: 'out' }                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DATABASE (SQLite)                                        │
│    books.db                                                 │
│    ├─ Row with ID 101 is modified                           │
│    └─ Confirm 1 row affected                                │
└────────────┬────────────────────────────────────────────────┘
             │
             │ (Data flowing back...)
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RETURN TO CLIENT                                         │
│                                                             │
│    - Service receives updated object                        │
│    - Controller receives object                             │
│    - Response: 200 OK                                       │
│      { "id": 101, "title": "Clean Code", "status": "out" }  │
└─────────────────────────────────────────────────────────────┘
```

**Steps:**
1. Client ส่ง PATCH request มาที่ /api/books/:id/borrow
2. Controller รับ Request และส่ง ID ให้ Service
3. Service เรียก Validator ตรวจสอบความถูกต้องของ ID และเช็คสถานะปัจจุบันจากฐานข้อมูล
4. หากตรวจสอบผ่าน Service จะเรียก Repository เพื่อสั่ง Update สถานะเป็น borrowed
5. Database บันทึกการเปลี่ยนแปลง
6. ข้อมูลที่ถูกแก้ไขแล้วจะถูกส่งกลับผ่านชั้นต่างๆ ไปยัง Client

---

## Summary

### Architecture Benefits
✅ **Separation of Concerns** - แยกส่วนรับ Request, ส่วนประมวลผล Logic และส่วนจัดการข้อมูลออกจากกัน
✅ **Maintainability** - แก้ไขกฎการยืม-คืนได้ที่ Service โดยไม่ต้องแก้ส่วนติดต่อฐานข้อมูล 
✅ **Data Integrity** - มั่นใจได้ว่าข้อมูล ISBN จะไม่ซ้ำและสถานะหนังสือจะถูกต้องผ่านการ Validate ใน Business Layer

### Key Principles
- ข้อมูลไหลลง (Downward flow) จาก Presentation -> Business -> Data
- Business Layer เป็นส่วนที่ตัดสินใจเกี่ยวกับกฎเกณฑ์สำคัญของห้องสมุด
- แต่ละ Layer ทำงานอิสระต่อกัน (Low Coupling)
```