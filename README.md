# Task Management System

A complete task management application with React + TypeScript frontend and Node.js + Express + SQLite backend.

## Quick Setup

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize database** (if not already done):
   ```bash
   npm run setup
   ```

4. **Seed with sample data**:
   ```bash
   npm run seed
   ```

5. **Start backend server**:
   ```bash
   npm run dev
   ```
   
   Backend will run on http://localhost:3001

### Frontend Setup

1. **Navigate to root directory** (if not already there):
   ```bash
   cd ..  # or cd /path/to/project/root
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start frontend development server**:
   ```bash
   npm run dev
   ```
   
   Frontend will run on http://localhost:5173

## Login Credentials

After seeding the database, you can login with:

- **Admin**: `admin` / `password123`
- **Staff**: `zahra` / `password123`  
- **Staff**: `babak` / `password123`

## API Integration

The frontend is configured to connect to the backend API automatically. All API calls are handled through the `lib/api.ts` module which:

- Reads API URL from environment variable (`VITE_API_URL`)
- Handles JWT token authentication
- Provides typed API functions for all endpoints

## Development

- **Frontend** (Vite + React + TypeScript): http://localhost:5173
- **Backend** (Node.js + Express + SQLite): http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## Environment Configuration

- **Frontend**: `.env` with `VITE_API_URL=http://localhost:3001`
- **Backend**: `backend/.env` with `FRONTEND_URL=http://localhost:5173`

## Production Build

### Frontend
```bash
npm run build
npm run preview  # To test production build locally
```

### Backend
```bash
cd backend
npm run build
npm start
```

## Features

- User authentication and role-based access
- Task management with assignments and status tracking
- Real-time chat on tasks
- File attachments
- Responsive Persian/Farsi UI
- Complete CRUD operations for tasks and users (admin)

## Troubleshooting

**CORS Issues**: Make sure backend `.env` has correct `FRONTEND_URL`
**Connection Issues**: Verify both servers are running on correct ports
**Login Issues**: Ensure database is seeded with sample users
