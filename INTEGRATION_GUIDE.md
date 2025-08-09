# Frontend-Backend Integration Guide

## Overview

This guide explains how to integrate the React frontend with the Node.js backend API. The setup is complete and ready to use.

## Files Created/Modified

### Environment Configuration
- ✅ **Frontend**: `.env` with `VITE_API_URL=http://localhost:3001`
- ✅ **Backend**: `backend/.env` with `FRONTEND_URL=http://localhost:5173`

### API Module
- ✅ **Created**: `lib/api.ts` - Complete API client with authentication

### CORS Configuration
- ✅ **Updated**: Backend CORS configured to read from `process.env.FRONTEND_URL`
- ✅ **Updated**: Health endpoint now returns `{ ok: true, ... }`

## Quick Start

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in new terminal):
   ```bash
   npm run dev
   ```

3. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## Using the API Module

The `lib/api.ts` module provides ready-to-use functions for all backend endpoints:

### Authentication
```typescript
import { login } from './lib/api';

// Login user
const { token, user } = await login('admin', 'password123');
// Token is automatically stored in localStorage
```

### Tasks
```typescript
import { getTasks, createTask, updateTask } from './lib/api';

// Get all tasks (with auth)
const tasks = await getTasks();

// Create new task (admin only)
const newTask = await createTask({
  title: 'New Task',
  description: 'Task description',
  priority: 'high',
  dueDate: '2024-12-31',
  assigneeIds: ['u1', 'u2']
});

// Update task
const updated = await updateTask(taskId, { status: 'done' });
```

### Users (Admin only)
```typescript
import { getUsers, createUser, updateUser, deleteUser } from './lib/api';

// Get all users
const users = await getUsers();

// Create user
const newUser = await createUser({
  fullName: 'New User',
  email: 'user@example.com',
  username: 'newuser',
  password: 'password123',
  role: 'staff'
});
```

### Chat & Attachments
```typescript
import { addChatMessage, uploadAttachment } from './lib/api';

// Add chat message
await addChatMessage(taskId, 'Hello from frontend!');

// Upload file
await uploadAttachment(taskId, fileObject);
```

## Replacing Mock Data

The current frontend uses mock data. To switch to real API data:

### 1. Replace Mock User Data
**Before** (mock data):
```typescript
const [users, setUsers] = useState(mockUsers);
```

**After** (real API):
```typescript
import { getUsers } from './lib/api';

const [users, setUsers] = useState([]);

useEffect(() => {
  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }
  loadUsers();
}, []);
```

### 2. Replace Mock Task Data
**Before** (mock data):
```typescript
const [tasks, setTasks] = useState(mockTasks);
```

**After** (real API):
```typescript
import { getTasks } from './lib/api';

const [tasks, setTasks] = useState([]);

useEffect(() => {
  async function loadTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }
  loadTasks();
}, []);
```

### 3. Replace Mock Authentication
**Before** (mock auth):
```typescript
const handleLogin = (username, password) => {
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (user) {
    setCurrentUser(user);
    return true;
  }
  return false;
};
```

**After** (real API):
```typescript
import { login } from './lib/api';

const handleLogin = async (username, password) => {
  try {
    const { user, token } = await login(username, password);
    setCurrentUser(user);
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

## Error Handling

The API module throws errors for failed requests. Always wrap API calls in try-catch:

```typescript
try {
  const data = await getTasks();
  setTasks(data);
} catch (error) {
  if (error.message === 'HTTP 401') {
    // Redirect to login
    localStorage.removeItem('token');
    setCurrentUser(null);
  } else {
    // Show error message
    console.error('API Error:', error);
  }
}
```

## Environment Variables

### Development
- Frontend: `VITE_API_URL=http://localhost:3001`
- Backend: `FRONTEND_URL=http://localhost:5173`

### Production
- Frontend: `VITE_API_URL=https://your-api-domain.com`
- Backend: `FRONTEND_URL=https://your-frontend-domain.com`

## CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `FRONTEND_URL` environment variable. For multiple frontend domains in production, update the CORS configuration in `backend/src/index.ts`.

## Authentication Flow

1. User logs in with username/password
2. Backend returns JWT token and user data
3. Token is stored in localStorage
4. All subsequent API calls include the token in Authorization header
5. Backend validates token and returns requested data

## Deployment Notes

- Ensure environment variables are set correctly in production
- Update CORS origins for production domains
- Use HTTPS in production
- Consider token refresh strategy for long-running sessions

## Testing

Test the API connection:

```bash
node test-api.js
```

This will verify:
- Health endpoint responds
- Login works with sample credentials
- Tasks can be fetched with authentication

## Ready to Use!

The integration is complete and idempotent. You can:
- Run the setup multiple times without issues
- Start developing with real API data immediately
- Switch between mock and real data as needed during development