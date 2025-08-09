import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { addAttachments, createTask, listTasks, requireAssigneeOrAdmin, updateTask } from '../controllers/task.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/tasks', requireAuth, listTasks);
router.post('/tasks', requireAuth, (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}, createTask);
router.put('/tasks/:id', requireAuth, updateTask);
router.post('/tasks/:id/attachments', requireAuth, requireAssigneeOrAdmin, upload.array('files'), addAttachments);

export default router;