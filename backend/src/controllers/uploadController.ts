import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';

export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const user = req.user!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check permissions: Staff can only upload to tasks they are assigned to
    if (user.role === 'staff' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ message: 'You can only upload files to tasks assigned to you' });
      return;
    }

    // Create attachment record
    const attachment = await TaskModel.addAttachment(taskId, {
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      uploaderId: user.id
    });

    res.status(201).json(attachment);

  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const uploadMultipleAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const user = req.user!;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Check permissions: Staff can only upload to tasks they are assigned to
    if (user.role === 'staff' && !task.assigneeIds.includes(user.id)) {
      res.status(403).json({ message: 'You can only upload files to tasks assigned to you' });
      return;
    }

    // Create attachment records for all files
    const attachments = [];
    for (const file of files) {
      const attachment = await TaskModel.addAttachment(taskId, {
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        uploaderId: user.id
      });
      attachments.push(attachment);
    }

    res.status(201).json(attachments);

  } catch (error) {
    console.error('Upload multiple attachments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};