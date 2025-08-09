import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { createUser, deleteUser, getMe, listUsers, updateUser } from '../controllers/user.controller';

const router = Router();

router.get('/users/me', requireAuth, getMe);
router.get('/users', requireAuth, requireRole('admin'), listUsers);
router.post('/users', requireAuth, requireRole('admin'), createUser);
router.put('/users/:id', requireAuth, requireRole('admin'), updateUser);
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser);

export default router;