# Product Management System - Architecture

## C1: System Context Diagram

\`\`\`
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
\`\`\`

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

\`\`\`
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
\`\`\`

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

\`\`\`
Client → Controller → Service → Repository → Database
         ↓ parse     ↓ validate  ↓ SQL       ↓ update status
         ← response ← ← ← ← ← ← ← ← ← ←
\`\`\`

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
\`\`\`