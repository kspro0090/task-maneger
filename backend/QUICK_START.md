# Quick Start Guide

Get the Task Management API up and running in just a few minutes!

## Prerequisites

Make sure you have these installed:
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Setup Database

### Create Database
```sql
CREATE DATABASE task_management;
```

### Run Schema
```bash
psql -U postgres -d task_management -f src/models/database.sql
```

## 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

## 4. Seed Database (Optional)

```bash
npm run seed
```

This creates sample users and tasks with these login credentials:
- **Admin**: `admin` / `password123`
- **Staff**: `zahra` / `password123`
- **Staff**: `babak` / `password123`

## 5. Start Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 6. Test the API

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password123"}'
```

### Get Tasks (with token from login response)
```bash
curl -X GET http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Documentation

Visit the [README.md](README.md) for complete API documentation.

## Health Check

Visit `http://localhost:3001/health` to verify the server is running.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `task_management` exists

### Port Already in Use
- Change `PORT` in `.env` to use a different port
- Or stop other services using port 3001

### Missing Dependencies
```bash
npm install
npm run build
```

## Next Steps

1. Connect your React frontend to this API
2. Configure production environment variables
3. Set up proper logging and monitoring
4. Deploy to your preferred hosting platform

Happy coding! 🚀