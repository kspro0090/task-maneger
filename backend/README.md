# Task Management Backend API

A complete RESTful API backend for a task management application built with Node.js, Express.js, and PostgreSQL.

## Features

- 🔐 JWT-based authentication
- 👥 Role-based access control (Admin, Staff, Viewer)
- 📋 Task management with assignments
- 💬 Real-time chat messages on tasks
- 📎 File attachment support
- 🔒 Secure password hashing with bcrypt
- 📁 File upload handling with validation
- 🛡️ Security middleware (CORS, Helmet)
- 📊 Database relationships and transactions

## Technology Stack

- **Platform**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **File Uploads**: Multer
- **Language**: TypeScript

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   ├── userController.ts    # User CRUD operations
│   │   ├── taskController.ts    # Task management
│   │   └── uploadController.ts  # File upload handling
│   ├── middleware/
│   │   ├── auth.ts             # JWT & role-based middleware
│   │   └── upload.ts           # Multer file upload middleware
│   ├── models/
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── User.ts             # User data access layer
│   │   ├── Task.ts             # Task data access layer
│   │   └── database.sql        # PostgreSQL schema
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   ├── users.ts            # User routes
│   │   └── tasks.ts            # Task routes
│   ├── utils/
│   │   └── jwt.ts              # JWT utility functions
│   ├── index.ts                # Main Express server
│   └── seed.ts                 # Database seeding script
├── uploads/                    # File upload directory
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE task_management;
```

2. Run the database schema:
```bash
psql -U postgres -d task_management -f src/models/database.sql
```

### 3. Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and other configurations.

### 4. Seed Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

### 5. Start the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

#### Login
- **POST** `/api/auth/login`
- **Body**: `{ "username": "admin", "password": "password123" }`
- **Response**: `{ "token": "jwt_token", "user": {...} }`

### Users (Admin Only)

#### Get All Users
- **GET** `/api/users`
- **Headers**: `Authorization: Bearer <token>`

#### Create User
- **POST** `/api/users`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: 
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "username": "john",
  "password": "password123",
  "phone": "1234567890",
  "role": "staff"
}
```

#### Update User
- **PUT** `/api/users/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: (same as create, all fields optional)

#### Delete User
- **DELETE** `/api/users/:id`
- **Headers**: `Authorization: Bearer <token>`

### Tasks

#### Get Tasks
- **GET** `/api/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Note**: Returns all tasks for Admin/Viewer, only assigned tasks for Staff

#### Create Task (Admin Only)
- **POST** `/api/tasks`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
```json
{
  "title": "Task Title",
  "description": "Task description",
  "priority": "high",
  "dueDate": "2024-12-31",
  "assigneeIds": ["user_id_1", "user_id_2"],
  "status": "todo"
}
```

#### Update Task
- **PUT** `/api/tasks/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: (same as create, all fields optional)
- **Note**: Staff can only update `status` (to "done") and `notes` for assigned tasks

#### Add Chat Message
- **POST** `/api/tasks/:id/messages`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "text": "Message content" }`

#### Upload Attachment
- **POST** `/api/tasks/:id/attachments`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `FormData` with `file` field

#### Upload Multiple Attachments
- **POST** `/api/tasks/:id/attachments/multiple`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `FormData` with `files` field (max 5 files)

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `full_name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `username` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `phone` (VARCHAR, Optional)
- `role` (ENUM: admin, staff, viewer)
- `avatar_url` (TEXT)
- `created_at`, `updated_at` (Timestamps)

### Tasks Table
- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `description` (TEXT, Optional)
- `priority` (ENUM: low, medium, high)
- `due_date` (DATE)
- `status` (ENUM: backlog, todo, doing, done, returned, approved, rejected)
- `notes` (TEXT, Optional)
- `created_at`, `updated_at` (Timestamps)

### Task Assignees (Junction Table)
- `task_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `assigned_at` (Timestamp)

### Attachments Table
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key)
- `name` (VARCHAR)
- `url` (TEXT)
- `uploader_id` (UUID, Foreign Key)
- `created_at` (Timestamp)

### Chat Messages Table
- `id` (UUID, Primary Key)
- `task_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `text` (TEXT)
- `timestamp` (Timestamp)

## Role-Based Permissions

### Admin
- Full access to all endpoints
- Can create, read, update, delete users
- Can create, read, update, delete tasks
- Can assign/unassign users to tasks
- Can upload files and send messages on any task

### Staff
- Can view only assigned tasks
- Can update only `status` (to "done") and `notes` on assigned tasks
- Can upload files and send messages on assigned tasks
- Cannot access user management endpoints

### Viewer
- Can view all tasks (read-only)
- Cannot modify tasks, upload files, or send messages
- Cannot access user management endpoints

## File Upload

- **Supported Types**: Images (JPEG, PNG, GIF), PDFs, Documents (DOC, DOCX, XLS, XLSX), Text files (TXT, CSV)
- **Size Limit**: 10MB per file
- **Count Limit**: 5 files per request
- **Storage**: Local filesystem in `uploads/` directory
- **URL**: Accessible via `/uploads/filename`

## Sample Login Credentials

After running the seed script:

- **Admin**: username=`admin`, password=`password123`
- **Staff 1**: username=`zahra`, password=`password123`
- **Staff 2**: username=`babak`, password=`password123`

## Error Handling

The API returns consistent error responses:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `413` - Payload Too Large
- `500` - Internal Server Error

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- CORS configuration
- Security headers with Helmet
- File type validation
- SQL injection prevention with parameterized queries
- Input validation and sanitization

## Development

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

### Health Check

The API provides a health check endpoint:
- **GET** `/health`
- **Response**: `{ "status": "OK", "message": "Task Management API is running", "timestamp": "..." }`

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Configure production database credentials
3. Change the JWT secret to a secure random string
4. Set up proper CORS origins
5. Configure reverse proxy (Nginx/Apache) if needed
6. Set up SSL/TLS certificates
7. Configure proper logging and monitoring