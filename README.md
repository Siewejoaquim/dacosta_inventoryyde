DaCosta All Motors Inventory System
===================================

This project is an MVP Inventory, Sales Invoice, and Reporting System for **DaCosta All Motors**.

Tech stack:
- Backend: NestJS (Node.js, TypeScript)
- Database: MongoDB
- Frontend: React
- Auth: JWT (JSON Web Tokens)

Project structure (high-level):
- `backend/` – NestJS REST API, MongoDB models, business logic
- `frontend/` – React admin dashboard

## Running the project locally

### Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (or a MongoDB URI)

### Backend (NestJS + MongoDB)

1. Open a terminal in the `backend` folder.
2. Copy `.env.example` to `.env` and adjust values if needed:

   - `MONGODB_URI` – your MongoDB connection string  
   - `JWT_SECRET` – any strong random string  
   - `PORT` – API port (defaults to `4000`)

3. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

4. Start the backend in dev mode:

   ```bash
   npm run start:dev
   ```

5. The REST API will be available at `http://localhost:4000/api`.

**Important backend endpoints (MVP):**

- `POST /api/auth/login` – admin/staff login (returns JWT)  
- `GET /api/users` – list users (admin only)  
- `POST /api/users` – create user (admin only)  
- `PATCH /api/users/:id` – update/disable user (admin only)  
- `GET /api/products` – list/search/filter products  
- `POST /api/products` – create product (admin only)  
- `PATCH /api/products/:id` – update product (admin only)  
- `DELETE /api/products/:id` – delete product (admin only)  
- `POST /api/invoices` – create invoice, auto-reduce stock  
- `GET /api/invoices` – list invoices  
- `GET /api/invoices/:id` – invoice details  
- `POST /api/stock/increase` – manual stock-in  
- `POST /api/stock/reduce` – manual stock-out  
- `GET /api/reports/weekly` – weekly sales report  
- `GET /api/reports/monthly` – monthly sales report  

All protected routes require an `Authorization: Bearer <token>` header from `/auth/login`.

### Frontend (React dashboard)

1. Open another terminal in the `frontend` folder.
2. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Start the React dev server:

   ```bash
   npm run dev
   ```

4. Open the dashboard in your browser at the URL printed by Vite (typically `http://localhost:5173`).

The frontend is already configured to proxy `/api` calls to `http://localhost:4000` via `vite.config.ts`.

### Initial admin user

For a real deployment you should seed an initial **Admin** user directly in MongoDB (e.g. via Mongo shell/Compass) with:

- `role`: `ADMIN`  
- `status`: `ACTIVE`  
- `username` / `password`: your chosen credentials (password must be a bcrypt hash)

After the first admin exists, use the **User management** page to create additional staff accounts.

