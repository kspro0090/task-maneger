import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Task Management API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File size too large. Maximum size is 10MB.' });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({ message: 'Too many files. Maximum is 5 files per request.' });
  }

  if (error.message?.includes('Invalid file type')) {
    return res.status(400).json({ message: error.message });
  }

  // Database connection errors
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({ message: 'Database connection failed' });
  }

  // Default error response
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Management API server is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📚 API Endpoints:');
    console.log('Authentication:');
    console.log('  POST /api/auth/login');
    console.log('Users (Admin only):');
    console.log('  GET    /api/users');
    console.log('  POST   /api/users');
    console.log('  PUT    /api/users/:id');
    console.log('  DELETE /api/users/:id');
    console.log('Tasks:');
    console.log('  GET  /api/tasks');
    console.log('  POST /api/tasks (Admin only)');
    console.log('  PUT  /api/tasks/:id');
    console.log('  POST /api/tasks/:id/messages');
    console.log('  POST /api/tasks/:id/attachments');
    console.log('  POST /api/tasks/:id/attachments/multiple');
    console.log('\n💡 To seed the database with sample data, run: npm run seed');
  }
});

export default app;