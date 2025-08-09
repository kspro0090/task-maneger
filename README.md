# Control-M Task Management System

A modern, bilingual (Persian/English) task management system built with React + TypeScript frontend and Node.js + Express backend.

## Features

- 🎯 **Kanban Board**: Drag-and-drop task management with multiple status columns
- 👥 **User Management**: Admin panel for managing users and roles
- 🔐 **Authentication**: Secure login with JWT tokens
- 💬 **Real-time Chat**: Task-specific chat functionality
- 📎 **File Attachments**: Upload and manage task attachments
- 🌐 **Bilingual**: Full Persian (RTL) and English support
- 📱 **Responsive**: Mobile-friendly design

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   Make sure the `.env` file exists with:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   
   **Note**: After changing environment variables in `.env`, you need to restart the Vite development server.

4. **Seed with sample data**:
   ```bash
   cd backend && npm run seed
   ```

The frontend will be available at `http://localhost:5173`

## Backend Setup

The backend runs on `http://localhost:3001`. See [backend/README.md](backend/README.md) for setup instructions.

## Development

### Frontend Structure
- `index.tsx` - Main application entry point
- `lib/api.ts` - API utilities and HTTP client
- `index.css` - Global styles and components

### Key Components
- **KanbanBoard**: Main task management interface
- **UserManagement**: Admin panel for user operations
- **Login**: Authentication interface
- **TaskDetails**: Detailed task view with chat and attachments

## Authentication

Default credentials (after seeding):
- **Admin**: `admin` / `password123`
- **Staff**: `staff` / `password123`
- **Viewer**: `viewer` / `password123`

## API Integration

The frontend connects to the backend API at the URL specified in `VITE_API_URL`. All API calls are handled through the `lib/api.ts` helper module.

### Environment Variables
- `VITE_API_URL`: Backend API base URL (default: http://localhost:3001)

## Technologies Used

### Frontend
- React 19
- TypeScript
- Vite
- CSS Modules

### Backend
- Node.js
- Express
- SQLite3
- JWT Authentication
- Multer (file uploads)

## Project Structure

```
├── index.tsx          # Main React application
├── index.css          # Global styles
├── lib/
│   └── api.ts         # API utilities
├── backend/           # Backend API server
│   ├── src/
│   │   ├── index.ts   # Express server
│   │   ├── database.ts # Database setup
│   │   └── seed.ts    # Sample data seeding
│   └── uploads/       # File attachments storage
└── README.md
```

## Development Tips

- Use the admin account to create and manage users
- Tasks can be dragged between status columns
- File attachments are stored in `backend/uploads/`
- All API requests include JWT authentication headers
- The interface automatically switches to Persian RTL when Persian text is detected

## Troubleshooting

**Build Issues**: Make sure all dependencies are installed with `npm install`

**API Connection Issues**: Verify the backend is running on the correct port and `VITE_API_URL` is set correctly

**Login Issues**: Ensure database is seeded with sample users

## License

MIT License
