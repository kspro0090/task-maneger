import { Router } from 'express';
import { getAllTasks, createTask, updateTask, addChatMessage } from '../controllers/taskController';
import { uploadAttachment, uploadMultipleAttachments } from '../controllers/uploadController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// GET /api/tasks - All authenticated users can view tasks (filtered by role)
router.get('/', getAllTasks);

// POST /api/tasks - Only admin can create tasks
router.post('/', requireAdmin, createTask);

// PUT /api/tasks/:id - Role-based permissions handled in controller
router.put('/:id', updateTask);

// POST /api/tasks/:id/messages - Add chat message to task
router.post('/:id/messages', addChatMessage);

// POST /api/tasks/:id/attachments - Upload single attachment
router.post('/:id/attachments', uploadSingle, uploadAttachment);

// POST /api/tasks/:id/attachments/multiple - Upload multiple attachments
router.post('/:id/attachments/multiple', uploadMultiple, uploadMultipleAttachments);

export default router;