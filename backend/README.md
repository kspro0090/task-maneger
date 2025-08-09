# Task Management Backend

A RESTful API backend for a task management application built with Node.js, Express, TypeScript, and SQLite.

## Features

- **User Management**: CRUD operations for users with role-based access control (Admin, Staff, Viewer)
- **Task Management**: Create, read, update, and delete tasks with assignees, priorities, and status tracking
- **File Attachments**: Upload and manage task attachments
- **Real-time Chat**: Task-specific messaging system
- **Authentication**: JWT-based authentication with role-based authorization
- **SQLite Database**: File-based database for easy deployment and data persistence

## Database

This application uses SQLite as the database engine, storing data in a file (`data.db` by default). This provides:
- Zero configuration setup
- File-based storage that persists across restarts
- No need for external database server
- Easy backup (just copy the file)

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file if needed (default values work for development)
   ```

3. **Initialize the database**:
   ```bash
   npm run setup
   ```

4. **Seed with sample data**:
   ```bash
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The server will start on http://localhost:3001

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - Get all tasks (or user's assigned tasks)
- `POST /api/tasks` - Create new task (Admin only)
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/messages` - Add chat message to task
- `POST /api/tasks/:id/attachments` - Upload single attachment
- `POST /api/tasks/:id/attachments/multiple` - Upload multiple attachments

## Sample Data

After running `npm run seed`, you can log in with these credentials:

- **Admin**: username=`admin`, password=`password123`
- **Staff 1**: username=`zahra`, password=`password123`  
- **Staff 2**: username=`babak`, password=`password123`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SQLITE_DB_PATH` | Path to SQLite database file | `./data.db` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-here` |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run setup` - Initialize database schema
- `npm run seed` - Populate database with sample data

## Database Schema

The SQLite database includes these tables:
- `users` - User accounts with roles
- `tasks` - Task information
- `task_assignees` - Many-to-many relationship between tasks and users
- `attachments` - File attachments for tasks
- `chat_messages` - Task-specific chat messages

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Password Hashing**: bcrypt
- **Security**: Helmet, CORS
- **Development**: Nodemon, ts-node

## Migration from PostgreSQL

This project has been migrated from PostgreSQL to SQLite. Key changes:
- Database configuration moved from connection pool to file-based SQLite
- All PostgreSQL-specific data types converted to SQLite equivalents
- UUID generation moved from `gen_random_uuid()` to `uuidv4()` package
- Query syntax updated from `$1, $2...` to `?` placeholders
- JSON aggregation functions replaced with separate queries

The API behavior and data structure remain exactly the same - only the underlying database technology has changed.