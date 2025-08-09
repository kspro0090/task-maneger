import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const payload = verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ 
      message: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Convenience middleware for specific roles
export const requireAdmin = requireRole(['admin']);
export const requireStaff = requireRole(['admin', 'staff']);
export const requireStaffOrAdmin = requireRole(['admin', 'staff']);

// Middleware to check if user can modify a task
export const canModifyTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Admin can modify any task
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Staff can only modify tasks they are assigned to
    if (req.user.role === 'staff') {
      const { TaskModel } = await import('../models/Task');
      const taskId = req.params.id;
      const task = await TaskModel.findById(taskId);

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      if (!task.assigneeIds.includes(req.user.id)) {
        res.status(403).json({ message: 'You can only modify tasks assigned to you' });
        return;
      }

      // Store task in request for use in controller
      (req as any).task = task;
      next();
      return;
    }

    // Viewer role cannot modify tasks
    res.status(403).json({ message: 'Insufficient permissions' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};