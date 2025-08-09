# Quick Start Guide

Get the Task Management API up and running in minutes with SQLite.

## Prerequisites

- Node.js (v16 or higher)
- npm

## Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Environment (Optional)
```bash
cp .env.example .env
# Edit .env if you want to change default settings
```

The default configuration works out of the box:
- Database: `./data.db` (SQLite file)
- Port: `3001`
- JWT Secret: Development key (change for production)

### 3. Initialize Database
```bash
npm run setup
```

This creates the SQLite database file and all necessary tables.

### 4. Seed with Sample Data
```bash
npm run seed
```

This adds sample users and tasks to get you started.

### 5. Start the Server
```bash
npm run dev
```

The API will be available at: http://localhost:3001

## Test the API

### Login as Admin
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

### Get Tasks (requires token from login)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/tasks
```

## Sample Accounts

After seeding, you can log in with:

- **Admin**: `admin` / `password123`
- **Staff**: `zahra` / `password123`
- **Staff**: `babak` / `password123`

## Database Location

Your SQLite database is stored at `backend/data.db`. This file contains all your data and persists across server restarts.

## Production Setup

For production:

1. Change JWT secret in `.env`:
   ```
   JWT_SECRET=your-super-secure-random-string-here
   ```

2. Build the project:
   ```bash
   npm run build
   npm start
   ```

3. Set up proper file permissions for the database file

4. Consider backup strategies for the `data.db` file

## Troubleshooting

**Port already in use?**
- Change the port in `.env`: `PORT=3002`
- Or kill existing processes: `pkill -f node`

**Database errors?**
- Delete `data.db` and run `npm run setup` again
- Check file permissions

**Can't login?**
- Make sure you ran `npm run seed`
- Check the seeded usernames and passwords above

That's it! You now have a fully functional task management API running with SQLite.