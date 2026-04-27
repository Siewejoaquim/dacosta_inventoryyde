# Software Requirements Specification (SRS)
## DaCosta All Motors Inventory Management System

**Version:** 1.0  
**Date:** March 24, 2026  
**Prepared by:** Development Team  
**Organization:** DaCosta All Motors

---

## Table of Contents
1. Introduction
2. Overall Description
3. System Features and Requirements
4. External Interface Requirements
5. Non-Functional Requirements
6. System Architecture
7. Data Requirements
8. Security Requirements
9. Appendices

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a complete description of the DaCosta All Motors Inventory Management System. It details the functional and non-functional requirements for the web-based inventory management application designed specifically for an auto parts retail business.

### 1.2 Scope
The DaCosta All Motors Inventory Management System is a full-stack web application that enables:
- Real-time inventory tracking for auto parts
- Invoice generation and payment management
- Daily expense logging and tracking
- Sales reporting and analytics
- Multi-user access with role-based permissions (Admin and Staff)
- Stock movement history and alerts

### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS**: Software Requirements Specification
- **API**: Application Programming Interface
- **CRUD**: Create, Read, Update, Delete
- **JWT**: JSON Web Token
- **Fr**: Francs (currency)
- **Admin**: Administrator user with full system access
- **Staff**: Employee user with limited system access
- **PARTIAL**: Payment status indicating discounted/negotiated price

### 1.4 References
- NestJS Documentation: https://docs.nestjs.com
- React Documentation: https://react.dev
- MongoDB Documentation: https://docs.mongodb.com

### 1.5 Overview
This document is organized into sections covering system description, functional requirements, interface requirements, and non-functional requirements.


---

## 2. Overall Description

### 2.1 Product Perspective
The DaCosta All Motors Inventory Management System is a standalone web application consisting of:
- **Frontend**: React-based single-page application (SPA) hosted on Netlify
- **Backend**: NestJS REST API hosted on Render
- **Database**: MongoDB Atlas cloud database

The system operates independently but integrates with browser printing capabilities for invoice generation.

### 2.2 Product Functions
The major functions include:
1. **User Authentication & Authorization**
   - Secure login with JWT tokens
   - Role-based access control (Admin/Staff)
   - Password management

2. **Product Management**
   - Add, edit, archive, and restore products
   - Category-based organization
   - Reorder point tracking
   - Low stock alerts
   - Dead stock detection

3. **Invoice Management**
   - Create invoices with multiple line items
   - Payment status tracking (PAID, UNPAID, PARTIAL)
   - Partial payment with discount tracking
   - Invoice printing
   - Void invoices with stock restoration

4. **Inventory Control**
   - Automatic stock deduction on sales
   - Stock adjustment history
   - Real-time stock levels

5. **Expense Tracking**
   - Daily expense logging by category
   - Staff expense editing (own entries)
   - Admin expense overview
   - Period-based expense reports

6. **Reporting & Analytics**
   - Daily, weekly, and monthly sales reports
   - Net profit calculation (revenue - expenses)
   - Custom date range reports
   - Low stock reports
   - Dead stock identification


### 2.3 User Classes and Characteristics

#### 2.3.1 Administrator (Admin)
- **Technical Expertise**: Moderate
- **Frequency of Use**: Daily
- **Privileges**: Full system access
- **Responsibilities**:
  - User management
  - Product catalog management
  - View all invoices and expenses
  - Access financial reports
  - System configuration

#### 2.3.2 Staff
- **Technical Expertise**: Basic to Moderate
- **Frequency of Use**: Daily
- **Privileges**: Limited access
- **Responsibilities**:
  - Create and manage own invoices
  - Log and edit own expenses
  - View product inventory
  - Basic sales operations

### 2.4 Operating Environment
- **Client-side**: Modern web browsers (Chrome, Firefox, Safari, Edge)
- **Server-side**: Node.js runtime environment
- **Database**: MongoDB 4.4+
- **Hosting**: 
  - Frontend: Netlify (https://dacostaautos.netlify.app)
  - Backend: Render (https://dacosta-inventory.onrender.com)
  - Database: MongoDB Atlas

### 2.5 Design and Implementation Constraints
- Must use HTTPS for all communications
- Must support mobile and desktop browsers
- Currency displayed in Francs (Fr)
- Real-time stock updates required
- Print functionality dependent on browser capabilities

### 2.6 Assumptions and Dependencies
- Users have stable internet connection
- Users have modern web browsers with JavaScript enabled
- MongoDB Atlas service availability
- Render and Netlify hosting service availability
- Users have basic computer literacy


---

## 3. System Features and Requirements

### 3.1 User Authentication and Authorization

#### 3.1.1 User Login
**Priority**: High  
**Description**: Users must authenticate before accessing the system.

**Functional Requirements**:
- FR-AUTH-001: System shall accept username and password credentials
- FR-AUTH-002: System shall validate credentials against database
- FR-AUTH-003: System shall generate JWT token upon successful authentication
- FR-AUTH-004: System shall store JWT token in browser local storage
- FR-AUTH-005: System shall redirect authenticated users to dashboard
- FR-AUTH-006: System shall display error message for invalid credentials

#### 3.1.2 Role-Based Access Control
**Priority**: High  
**Description**: System enforces different permission levels based on user roles.

**Functional Requirements**:
- FR-RBAC-001: System shall support two user roles: ADMIN and STAFF
- FR-RBAC-002: Admin users shall have access to all system features
- FR-RBAC-003: Staff users shall only view their own invoices
- FR-RBAC-004: Staff users shall only edit their own expenses
- FR-RBAC-005: Admin-only pages shall return 403 error for staff access attempts
- FR-RBAC-006: System shall decode JWT token to determine user role

#### 3.1.3 Password Management
**Priority**: Medium  
**Description**: Users can change their passwords.

**Functional Requirements**:
- FR-PWD-001: System shall provide password change functionality
- FR-PWD-002: System shall require current password verification
- FR-PWD-003: System shall hash passwords using bcrypt
- FR-PWD-004: System shall enforce minimum password requirements


### 3.2 Product Management

#### 3.2.1 Product CRUD Operations
**Priority**: High  
**Description**: System manages product catalog with full CRUD capabilities.

**Functional Requirements**:
- FR-PROD-001: System shall allow creating products with name, category, cost, selling price, quantity, reorder point
- FR-PROD-002: System shall allow editing product details
- FR-PROD-003: System shall soft-delete products (archive) instead of permanent deletion
- FR-PROD-004: System shall allow restoring archived products
- FR-PROD-005: System shall display only active products by default
- FR-PROD-006: System shall support product search by name
- FR-PROD-007: System shall filter products by category
- FR-PROD-008: System shall auto-generate unique product IDs

#### 3.2.2 Stock Alerts
**Priority**: High  
**Description**: System alerts users about low stock levels.

**Functional Requirements**:
- FR-STOCK-001: System shall flag products below reorder point as low stock
- FR-STOCK-002: System shall display low stock count on dashboard
- FR-STOCK-003: System shall use per-product reorder points for alerts
- FR-STOCK-004: System shall identify dead stock (no sales in 30+ days)


### 3.3 Invoice Management

#### 3.3.1 Invoice Creation
**Priority**: High  
**Description**: System creates sales invoices with automatic stock deduction.

**Functional Requirements**:
- FR-INV-001: System shall generate unique invoice numbers (format: INV-YYYYMMDD-XXXXXX)
- FR-INV-002: System shall allow multiple line items per invoice
- FR-INV-003: System shall auto-populate product prices from catalog
- FR-INV-004: System shall allow manual price override per line item
- FR-INV-005: System shall calculate total amount automatically
- FR-INV-006: System shall capture customer name and phone
- FR-INV-007: System shall set payment status (PAID, UNPAID, PARTIAL) at creation
- FR-INV-008: System shall automatically deduct sold quantities from stock
- FR-INV-009: System shall record invoice creator (user ID)
- FR-INV-010: System shall timestamp invoice creation

#### 3.3.2 Partial Payment Handling
**Priority**: High  
**Description**: System handles discounted/negotiated prices.

**Functional Requirements**:
- FR-PART-001: System shall allow setting PARTIAL payment status
- FR-PART-002: System shall record original calculated price
- FR-PART-003: System shall set invoice total to discounted amount paid
- FR-PART-004: System shall display both original and discounted prices
- FR-PART-005: System shall mark invoice as PARTIAL in listings


#### 3.3.3 Invoice Printing
**Priority**: High  
**Description**: System generates printable invoice documents.

**Functional Requirements**:
- FR-PRINT-001: System shall open print dialog after invoice creation
- FR-PRINT-002: System shall format invoice with company header "DACOSTA ALL MOTORS"
- FR-PRINT-003: System shall display customer details, invoice number, date
- FR-PRINT-004: System shall show itemized product list with quantities and prices
- FR-PRINT-005: System shall display total amount prominently
- FR-PRINT-006: System shall show payment status (PAID/UNPAID/PARTIAL)
- FR-PRINT-007: For PARTIAL invoices, shall show original price (strikethrough) and discounted price
- FR-PRINT-008: System shall allow reprinting from invoice detail page

#### 3.3.4 Invoice Void
**Priority**: Medium  
**Description**: Admins can void invoices and restore stock.

**Functional Requirements**:
- FR-VOID-001: System shall allow admin users to void invoices
- FR-VOID-002: System shall restore stock quantities when invoice voided
- FR-VOID-003: System shall record void timestamp and user
- FR-VOID-004: System shall prevent editing voided invoices
- FR-VOID-005: System shall exclude voided invoices from sales reports


### 3.4 Expense Management

#### 3.4.1 Expense Logging
**Priority**: High  
**Description**: Staff and admin can log daily business expenses.

**Functional Requirements**:
- FR-EXP-001: System shall allow logging expenses with description, amount, category
- FR-EXP-002: System shall support categories: Food, Transport, Supplies, Utilities, Other
- FR-EXP-003: System shall auto-timestamp expense entries
- FR-EXP-004: System shall record expense creator (user ID)
- FR-EXP-005: System shall display today's expenses in real-time
- FR-EXP-006: System shall calculate daily expense total

#### 3.4.2 Expense Editing
**Priority**: Medium  
**Description**: Users can edit their own expense entries.

**Functional Requirements**:
- FR-EXP-EDIT-001: System shall allow staff to edit their own expenses
- FR-EXP-EDIT-002: System shall allow admin to edit any expense
- FR-EXP-EDIT-003: System shall provide inline editing interface
- FR-EXP-EDIT-004: System shall validate expense ownership before allowing edits
- FR-EXP-EDIT-005: System shall return 403 error if staff tries to edit others' expenses

#### 3.4.3 Expense Reporting
**Priority**: High  
**Description**: Admin can view expense summaries and trends.

**Functional Requirements**:
- FR-EXP-RPT-001: System shall provide expense summary by period (monthly/6months/yearly/custom)
- FR-EXP-RPT-002: System shall group expenses by category
- FR-EXP-RPT-003: System shall calculate total expenses per period
- FR-EXP-RPT-004: System shall restrict expense summary to admin users only


### 3.5 Reporting and Analytics

#### 3.5.1 Dashboard
**Priority**: High  
**Description**: Role-specific dashboard with key metrics.

**Functional Requirements**:
- FR-DASH-001: System shall display total products count
- FR-DASH-002: System shall show today's sales total
- FR-DASH-003: System shall show today's expenses total
- FR-DASH-004: System shall calculate net profit (sales - expenses) for today
- FR-DASH-005: Admin dashboard shall show weekly and monthly revenue
- FR-DASH-006: Admin dashboard shall show monthly expenses and net profit
- FR-DASH-007: System shall display low stock products list
- FR-DASH-008: Admin dashboard shall show dead stock items
- FR-DASH-009: System shall show recent invoices (last 5)

#### 3.5.2 Sales Reports
**Priority**: High  
**Description**: Detailed sales reporting with date ranges.

**Functional Requirements**:
- FR-RPT-001: System shall generate weekly sales reports
- FR-RPT-002: System shall generate monthly sales reports
- FR-RPT-003: System shall support custom date range reports
- FR-RPT-004: System shall exclude voided invoices from reports
- FR-RPT-005: System shall calculate revenue totals
- FR-RPT-006: System shall export inventory data to CSV

#### 3.5.3 Stock History
**Priority**: Medium  
**Description**: Track all stock movements.

**Functional Requirements**:
- FR-HIST-001: System shall log all stock increases (IN)
- FR-HIST-002: System shall log all stock decreases (OUT)
- FR-HIST-003: System shall record user who made the change
- FR-HIST-004: System shall timestamp all stock movements
- FR-HIST-005: System shall display stock history in reverse chronological order


### 3.6 Product Request Management

#### 3.6.1 Request Logging
**Priority**: Low  
**Description**: Staff can log customer requests for out-of-stock items.

**Functional Requirements**:
- FR-REQ-001: System shall allow logging product requests with name, customer name, phone
- FR-REQ-002: System shall timestamp request entries
- FR-REQ-003: System shall record staff member who logged request
- FR-REQ-004: System shall default status to PENDING

#### 3.6.2 Request Fulfillment
**Priority**: Low  
**Description**: Admin can mark requests as fulfilled.

**Functional Requirements**:
- FR-REQ-005: System shall allow admin to mark requests as FULFILLED
- FR-REQ-006: System shall filter requests by status
- FR-REQ-007: System shall display request history

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements
- UI-001: System shall use responsive design for mobile and desktop
- UI-002: System shall use Inter font family
- UI-003: System shall use consistent color scheme (primary: #2563eb, success: #15803d, error: #b91c1c)
- UI-004: System shall display currency in Francs (Fr) format
- UI-005: System shall use react-icons (Remix Icons) for all icons
- UI-006: System shall provide sidebar navigation with role-based menu items


#### 4.1.2 Page-Specific UI Requirements
- UI-007: Login page shall have gradient background with centered form
- UI-008: Dashboard shall display metrics in card layout
- UI-009: Product list shall show table with search and filter controls
- UI-010: Invoice creation shall use multi-row form with dynamic line items
- UI-011: Expense page shall use two-column layout (form + list)
- UI-012: Reports page shall provide date range selectors and export buttons

### 4.2 Hardware Interfaces
- No direct hardware interfaces required
- System relies on standard browser printing capabilities

### 4.3 Software Interfaces

#### 4.3.1 Frontend to Backend API
- API-001: Communication via HTTPS REST API
- API-002: Base URL: https://dacosta-inventory.onrender.com/api
- API-003: Authentication via JWT Bearer tokens in Authorization header
- API-004: Request/response format: JSON
- API-005: CORS enabled for https://dacostaautos.netlify.app and localhost:5173

#### 4.3.2 Backend to Database
- DB-001: MongoDB connection via Mongoose ODM
- DB-002: Connection string stored in environment variable
- DB-003: Database name: nextjs
- DB-004: Collections: users, products, invoices, expenses, stockhistories, productrequests

### 4.4 Communication Interfaces
- COMM-001: All client-server communication over HTTPS
- COMM-002: WebSocket not required (REST API sufficient)
- COMM-003: Standard HTTP methods: GET, POST, PATCH, DELETE


---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- PERF-001: Page load time shall not exceed 3 seconds on standard broadband
- PERF-002: API response time shall not exceed 2 seconds for 95% of requests
- PERF-003: System shall support up to 10 concurrent users
- PERF-004: Database queries shall use indexes for frequently accessed fields
- PERF-005: Invoice list shall limit to 100 most recent records

### 5.2 Security Requirements
- SEC-001: All passwords shall be hashed using bcrypt with salt rounds ≥ 10
- SEC-002: JWT tokens shall expire after 24 hours
- SEC-003: JWT secret shall be stored in environment variables
- SEC-004: All API endpoints (except login) shall require authentication
- SEC-005: Role-based endpoints shall validate user role from JWT
- SEC-006: System shall prevent SQL/NoSQL injection via input validation
- SEC-007: System shall sanitize user inputs
- SEC-008: HTTPS shall be enforced for all communications
- SEC-009: Sensitive data (passwords, tokens) shall not be logged

### 5.3 Reliability Requirements
- REL-001: System uptime shall be 99% (excluding planned maintenance)
- REL-002: Database shall have automated backups (MongoDB Atlas)
- REL-003: System shall handle database connection failures gracefully
- REL-004: Failed transactions shall not leave database in inconsistent state
- REL-005: Stock deduction and invoice creation shall be atomic operations


### 5.4 Maintainability Requirements
- MAINT-001: Code shall follow consistent style guide (ESLint/Prettier)
- MAINT-002: Backend shall use modular architecture (NestJS modules)
- MAINT-003: Frontend shall use component-based architecture (React)
- MAINT-004: API endpoints shall follow RESTful conventions
- MAINT-005: Database schemas shall be defined using Mongoose schemas
- MAINT-006: Environment-specific configuration via .env files

### 5.5 Usability Requirements
- USE-001: System shall provide clear error messages for validation failures
- USE-002: Forms shall indicate required fields
- USE-003: System shall provide visual feedback for loading states
- USE-004: Navigation shall be intuitive with clear menu labels
- USE-005: System shall use consistent terminology throughout
- USE-006: Critical actions (void, delete) shall require confirmation

### 5.6 Scalability Requirements
- SCALE-001: Database schema shall support horizontal scaling
- SCALE-002: API shall be stateless to support load balancing
- SCALE-003: System shall handle up to 10,000 products
- SCALE-004: System shall handle up to 100,000 invoices
- SCALE-005: System shall handle up to 50,000 expense entries

### 5.7 Portability Requirements
- PORT-001: Frontend shall work on Chrome, Firefox, Safari, Edge (latest 2 versions)
- PORT-002: System shall be responsive for screen sizes 320px to 2560px
- PORT-003: Backend shall run on Node.js 16+ environments
- PORT-004: Database shall be MongoDB 4.4+


---

## 6. System Architecture

### 6.1 Technology Stack

#### 6.1.1 Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Styling**: Custom CSS with CSS variables
- **Icons**: react-icons (Remix Icons)
- **Hosting**: Netlify

#### 6.1.2 Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken, passport-jwt)
- **Validation**: class-validator, class-transformer
- **Database ODM**: Mongoose
- **Hosting**: Render

#### 6.1.3 Database
- **Database**: MongoDB
- **Hosting**: MongoDB Atlas
- **Connection**: Mongoose ODM

### 6.2 Architecture Pattern
- **Frontend**: Component-based architecture with functional components and hooks
- **Backend**: Modular architecture with controllers, services, and repositories
- **API**: RESTful API with resource-based endpoints
- **Authentication**: JWT-based stateless authentication


### 6.3 Module Structure

#### 6.3.1 Backend Modules
1. **AuthModule**: Authentication and authorization
2. **UsersModule**: User management
3. **ProductsModule**: Product catalog management
4. **InvoicesModule**: Invoice creation and management
5. **StockModule**: Stock tracking and history
6. **ExpensesModule**: Expense logging and reporting
7. **ReportsModule**: Sales and analytics reports
8. **ProductRequestsModule**: Customer product requests

#### 6.3.2 Frontend Pages
1. **LoginPage**: User authentication
2. **DashboardPage**: Role-specific overview
3. **ProductsPage**: Product listing and management
4. **ProductFormPage**: Add/edit products
5. **InvoiceCreatePage**: Create new invoices
6. **InvoicesPage**: Invoice listing
7. **InvoiceDetailPage**: View/edit invoice details
8. **ExpensesPage**: Daily expense logging
9. **ExpenseTrackingPage**: Admin expense analytics
10. **ReportsPage**: Sales reports and exports
11. **StockHistoryPage**: Stock movement history
12. **ProductRequestsPage**: Customer request management
13. **UsersPage**: User management (admin)
14. **ChangePasswordPage**: Password management

---

## 7. Data Requirements

### 7.1 Database Schema

#### 7.1.1 Users Collection
```
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: Enum ['ADMIN', 'STAFF'] (required),
  status: Enum ['ACTIVE', 'INACTIVE'] (default: ACTIVE),
  createdAt: Date,
  updatedAt: Date
}
```


#### 7.1.2 Products Collection
```
{
  _id: ObjectId,
  productName: String (required),
  category: String (required),
  costPrice: Number (required, min: 0),
  sellingPrice: Number (required, min: 0),
  quantityInStock: Number (required, default: 0),
  reorderPoint: Number (default: 5),
  isArchived: Boolean (default: false),
  lastUpdated: Date,
  createdAt: Date
}
```

#### 7.1.3 Invoices Collection
```
{
  _id: ObjectId,
  invoiceNumber: String (unique, required),
  customerName: String (required),
  customerPhone: String,
  itemsPurchased: [{
    productId: ObjectId (ref: Product),
    productName: String,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  totalAmount: Number (required),
  originalAmount: Number (for PARTIAL payments),
  status: Enum ['PAID', 'UNPAID', 'PARTIAL', 'VOID'],
  amountPaid: Number (default: 0),
  createdBy: ObjectId (ref: User),
  voidedAt: Date,
  voidedBy: ObjectId (ref: User),
  dateCreated: Date
}
```


#### 7.1.4 Expenses Collection
```
{
  _id: ObjectId,
  description: String (required),
  amount: Number (required, min: 0),
  category: String (required),
  loggedBy: ObjectId (ref: User),
  date: Date (auto-generated)
}
```

#### 7.1.5 StockHistories Collection
```
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  changeType: Enum ['IN', 'OUT'],
  quantityChanged: Number,
  userId: ObjectId (ref: User),
  date: Date (auto-generated)
}
```

#### 7.1.6 ProductRequests Collection
```
{
  _id: ObjectId,
  productName: String (required),
  customerName: String (required),
  customerPhone: String,
  status: Enum ['PENDING', 'FULFILLED'] (default: PENDING),
  requestedBy: ObjectId (ref: User),
  dateRequested: Date (auto-generated)
}
```

### 7.2 Data Validation Rules
- All monetary values must be non-negative
- Invoice numbers must be unique and follow format INV-YYYYMMDD-XXXXXX
- Usernames must be unique
- Stock quantities cannot go negative
- Dates must be valid ISO 8601 format
- Phone numbers are optional but must be strings
- Category values must match predefined lists


### 7.3 Data Retention
- Invoices: Retained indefinitely (including voided)
- Expenses: Retained indefinitely
- Stock history: Retained indefinitely
- Product requests: Retained indefinitely
- Archived products: Retained until manually deleted
- User sessions (JWT): 24-hour expiration

---

## 8. Security Requirements

### 8.1 Authentication Security
- AUTH-SEC-001: Passwords must be hashed using bcrypt with minimum 10 salt rounds
- AUTH-SEC-002: JWT tokens must be signed with secret key stored in environment variables
- AUTH-SEC-003: JWT tokens must include user ID and role in payload
- AUTH-SEC-004: Failed login attempts must not reveal whether username or password is incorrect
- AUTH-SEC-005: Tokens must be validated on every protected API request

### 8.2 Authorization Security
- AUTHZ-SEC-001: All endpoints except /auth/login must require valid JWT
- AUTHZ-SEC-002: Role-based endpoints must verify user role from JWT payload
- AUTHZ-SEC-003: Staff users must only access their own invoices and expenses
- AUTHZ-SEC-004: Admin-only endpoints must return 403 for non-admin users
- AUTHZ-SEC-005: Resource ownership must be validated before edit/delete operations

### 8.3 Data Security
- DATA-SEC-001: Database connection string must be stored in environment variables
- DATA-SEC-002: Sensitive data must not be logged to console or files
- DATA-SEC-003: API responses must not include password hashes
- DATA-SEC-004: CORS must be configured to allow only trusted origins
- DATA-SEC-005: Input validation must prevent NoSQL injection attacks


### 8.4 Network Security
- NET-SEC-001: All communications must use HTTPS/TLS
- NET-SEC-002: API must reject requests without proper Content-Type headers
- NET-SEC-003: Rate limiting should be implemented to prevent abuse
- NET-SEC-004: CORS headers must be properly configured

---

## 9. Appendices

### 9.1 API Endpoints Summary

#### Authentication
- POST /api/auth/login - User login

#### Users
- GET /api/users - List all users (admin)
- POST /api/users - Create user (admin)
- PATCH /api/users/:id - Update user (admin)
- DELETE /api/users/:id - Delete user (admin)
- PATCH /api/users/me/password - Change own password

#### Products
- GET /api/products - List products (with filters)
- GET /api/products/:id - Get product details
- POST /api/products - Create product (admin)
- PATCH /api/products/:id - Update product (admin)
- DELETE /api/products/:id - Archive product (admin)
- PATCH /api/products/:id/restore - Restore product (admin)
- GET /api/products/categories - Get category list
- GET /api/products/dead-stock - Get dead stock items (admin)

#### Invoices
- GET /api/invoices - List invoices
- GET /api/invoices/:id - Get invoice details
- POST /api/invoices - Create invoice
- PATCH /api/invoices/:id/payment - Update payment
- PATCH /api/invoices/:id/void - Void invoice (admin)


#### Expenses
- GET /api/expenses/today - Get today's expenses
- GET /api/expenses - Get expenses by date range (admin)
- GET /api/expenses/summary - Get expense summary (admin)
- POST /api/expenses - Create expense
- PATCH /api/expenses/:id - Update expense

#### Stock
- GET /api/stock/history - Get stock movement history
- POST /api/stock/adjust - Manual stock adjustment (admin)

#### Reports
- GET /api/reports/weekly - Weekly sales report
- GET /api/reports/monthly - Monthly sales report
- GET /api/reports/custom - Custom date range report

#### Product Requests
- GET /api/product-requests - List product requests
- POST /api/product-requests - Create request
- PATCH /api/product-requests/:id - Update request status (admin)

### 9.2 Environment Variables

#### Backend (.env)
```
MONGODB_URI=<MongoDB connection string>
JWT_SECRET=<Secret key for JWT signing>
PORT=4000
```

#### Frontend
```
VITE_API_URL=https://dacosta-inventory.onrender.com/api
```


### 9.3 Deployment Information

#### Frontend Deployment (Netlify)
- **URL**: https://dacostaautos.netlify.app
- **Build Command**: npm run build
- **Publish Directory**: dist
- **Node Version**: 18+

#### Backend Deployment (Render)
- **URL**: https://dacosta-inventory.onrender.com
- **Build Command**: npm install && npm run build
- **Start Command**: npm run start:prod
- **Node Version**: 18+
- **Environment**: Production

#### Database (MongoDB Atlas)
- **Cluster**: Shared M0 (Free Tier)
- **Region**: Closest to application servers
- **Backup**: Automated daily backups

### 9.4 User Roles and Permissions Matrix

| Feature | Admin | Staff |
|---------|-------|-------|
| View Dashboard | ✓ | ✓ (limited) |
| Manage Products | ✓ | ✗ |
| Create Invoices | ✓ | ✓ |
| View All Invoices | ✓ | ✗ (own only) |
| Void Invoices | ✓ | ✗ |
| Log Expenses | ✓ | ✓ |
| Edit Own Expenses | ✓ | ✓ |
| Edit All Expenses | ✓ | ✗ |
| View Expense Reports | ✓ | ✗ |
| View Sales Reports | ✓ | ✗ |
| Manage Users | ✓ | ✗ |
| Stock Adjustments | ✓ | ✗ |
| Product Requests | ✓ | ✓ |
| Change Own Password | ✓ | ✓ |


### 9.5 Business Rules

#### Invoice Business Rules
1. Invoice numbers are auto-generated and cannot be manually set
2. Stock is automatically deducted when invoice is created
3. Stock is automatically restored when invoice is voided
4. Voided invoices cannot be edited or un-voided
5. For PARTIAL payments, the invoice total equals the discounted amount paid
6. Original price is stored separately for PARTIAL invoices for reference
7. Staff can only view and manage their own invoices
8. Only admins can void invoices

#### Stock Business Rules
1. Stock quantity cannot go negative (validation enforced)
2. Low stock threshold is per-product (reorderPoint field)
3. Dead stock is identified as products with no sales in 30+ days
4. Archived products are hidden from active listings but retained in database
5. Stock adjustments are logged in stock history

#### Expense Business Rules
1. Expenses are categorized: Food, Transport, Supplies, Utilities, Other
2. Staff can only edit their own expense entries
3. Admins can edit any expense entry
4. Expense summaries are admin-only
5. Daily expenses are visible to all authenticated users

#### Payment Business Rules
1. PAID status: Full amount paid (amountPaid = totalAmount)
2. UNPAID status: No payment received (amountPaid = 0)
3. PARTIAL status: Discounted/negotiated price (totalAmount = amountPaid, originalAmount stored)
4. Payment status can be updated after invoice creation
5. Voided invoices cannot have payment updates


### 9.6 Glossary

- **Admin**: Administrator user with full system access and management capabilities
- **Archive**: Soft delete operation that hides records without permanent deletion
- **Dead Stock**: Products that haven't sold in 30+ days, tying up capital
- **Francs (Fr)**: Currency unit used in the system
- **Invoice**: Sales document recording customer purchase transaction
- **JWT**: JSON Web Token used for stateless authentication
- **Low Stock**: Products below their defined reorder point threshold
- **ODM**: Object Document Mapper (Mongoose for MongoDB)
- **PARTIAL**: Payment status indicating negotiated/discounted price
- **Reorder Point**: Minimum stock level that triggers low stock alert
- **SPA**: Single Page Application (React frontend)
- **Staff**: Employee user with limited system access
- **Stock History**: Log of all inventory movements (IN/OUT)
- **Void**: Cancel an invoice and restore stock quantities

### 9.7 Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | March 24, 2026 | Development Team | Initial SRS document |

---

## Document Approval

This Software Requirements Specification has been reviewed and approved by:

**Project Stakeholders:**
- DaCosta All Motors Management

**Development Team:**
- Backend Developer
- Frontend Developer
- System Architect

**Date of Approval:** March 24, 2026

---

**End of Document**
