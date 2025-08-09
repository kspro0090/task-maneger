import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { TaskCreate, TaskUpdate, TaskStatus } from '../models/types';

export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let tasks;

    if (user.role === 'admin' || user.role === 'viewer') {
      // Admin and viewer can see all tasks
      tasks = await TaskModel.findAll();
    } else if (user.role === 'staff') {
      // Staff can only see tasks assigned to them
      tasks = await TaskModel.findByAssigneeId(user.id);
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskData: TaskCreate = req.body;

    // Validate required fields
    if (!taskData.title || !taskData.priority || !taskData.dueDate || !taskData.assigneeIds) {
      res.status(400).json({ 
        message: 'Title, priority, due date, and assignee IDs are required' 
      });
      return;
    }

    // Validate due date format
    const dueDate = new Date(taskData.dueDate);
    if (isNaN(dueDate.getTime())) {
      res.status(400).json({ message: 'Invalid due date format' });
      return;
    }

    const newTask = await TaskModel.create({
      ...taskData,
      dueDate
    });

    res.status(201).json(newTask);

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const updateData: TaskUpdate = req.body;

    // Check if task exists
    const existingTask = await TaskModel.findById(id);
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Role-based field restrictions
    if (user.role === 'staff') {
      // Staff can only update specific fields and only if they are assigned to the task
      if (!existingTask.assigneeIds.includes(user.id)) {
        res.status(403).json({ message: 'You can only modify tasks assigned to you' });
        return;
      }

      // Staff can only update status (to 'done'), notes, attachments, and chat messages
      const allowedFields = ['status', 'notes'];
      const providedFields = Object.keys(updateData);
      const disallowedFields = providedFields.filter(field => !allowedFields.includes(field));

      if (disallowedFields.length > 0) {
        res.status(403).json({ 
          message: `Staff can only update: ${allowedFields.join(', ')}. Cannot update: ${disallowedFields.join(', ')}` 
        });
        return;
      }

      // Staff can only change status to 'done'
      if (updateData.status && updateData.status !== 'done') {
        res.status(403).json({ message: 'Staff can only change status to "done"' });
        return;
      }
    }

    // Validate due date if provided
    if (updateData.dueDate) {
      const dueDate = new Date(updateData.dueDate);
      if (isNaN(dueDate.getTime())) {
        res.status(400).json({ message: 'Invalid due date format' });
        return;
      }
      updateData.dueDate = dueDate;
    }

    const updatedTask = await TaskModel.update(id, updateData);

    if (!updatedTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = req.user!;

    if (!text || text.trim() === '') {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    // Check if task exists
    const task = await TaskModel.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Staff can only add messages to tasks they are assigned to
    if (user.role === 'staff' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ message: 'You can only add messages to tasks assigned to you' });
      return;
    }

    const chatMessage = await TaskModel.addChatMessage(id, {
      userId: user.id,
      text: text.trim()
    });

    res.status(201).json(chatMessage);

  } catch (error) {
    console.error('Add chat message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};