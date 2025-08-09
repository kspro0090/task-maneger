import { Request, Response } from 'express';
import { prisma } from '../../../src/config/prisma';
import { AuthUserRole } from '../middleware/auth.middleware';

const includeTask = {
  assignees: true,
  attachments: {
    include: {
      uploader: {
        select: { id: true, fullName: true, email: true, username: true, role: true, avatarUrl: true, phone: true },
      },
    },
  },
  chatMessages: {
    include: {
      user: { select: { id: true, fullName: true, email: true, username: true, role: true, avatarUrl: true, phone: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

const mapTask = (task: any) => {
  return {
    ...task,
    dueDate: task.dueDate.toISOString(),
    chatMessages: task.chatMessages.map((m: any) => ({ ...m, timestamp: m.timestamp.toISOString() })),
  };
};

export const listTasks = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const role: AuthUserRole = req.user.role;

    let tasks;
    if (role === 'admin' || role === 'viewer') {
      tasks = await prisma.task.findMany({ include: includeTask, orderBy: { createdAt: 'desc' } });
    } else {
      tasks = await prisma.task.findMany({
        where: { assignees: { some: { id: req.user.id } } },
        include: includeTask,
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.status(200).json(tasks.map(mapTask));
  } catch (error) {
    console.error('listTasks error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, dueDate, status, notes, assigneeIds } = req.body as any;

    if (!title || !description || !priority || !dueDate || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const created = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        notes: notes ?? null,
        dueDate: new Date(dueDate),
        assignees: assigneeIds && Array.isArray(assigneeIds)
          ? { connect: (assigneeIds as string[]).map((id) => ({ id })) }
          : undefined,
      },
      include: includeTask,
    });

    return res.status(201).json(mapTask(created));
  } catch (error) {
    console.error('createTask error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const role = req.user.role;
    const body = req.body as any;

    const data: any = {};

    if (role === 'admin') {
      if (body.title !== undefined) data.title = body.title;
      if (body.description !== undefined) data.description = body.description;
      if (body.priority !== undefined) data.priority = body.priority;
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
      if (Array.isArray(body.assigneeIds)) {
        data.assignees = { set: (body.assigneeIds as string[]).map((userId) => ({ id: userId })) };
      }
    } else if (role === 'staff') {
      if (body.status !== undefined) data.status = body.status;
      if (body.notes !== undefined) data.notes = body.notes;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Process new chat messages if provided
    const chatMessagesToCreate: Array<{ text: string; userId: string }> = [];
    if (Array.isArray(body.chatMessages)) {
      for (const msg of body.chatMessages) {
        if (msg && typeof msg.text === 'string' && msg.text.trim().length > 0) {
          chatMessagesToCreate.push({ text: msg.text.trim(), userId: req.user.id });
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        chatMessages: chatMessagesToCreate.length
          ? { create: chatMessagesToCreate.map((m) => ({ text: m.text, userId: m.userId })) }
          : undefined,
      },
      include: includeTask,
    });

    return res.status(200).json(mapTask(updated));
  } catch (error: any) {
    console.error('updateTask error', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireAssigneeOrAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params; // task id
    if (req.user.role === 'admin') return next();

    const task = await prisma.task.findUnique({
      where: { id },
      select: { assignees: { where: { id: req.user.id }, select: { id: true } } },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.assignees.length === 0) {
      return res.status(403).json({ error: 'Only assignees can perform this action' });
    }

    return next();
  } catch (error) {
    console.error('requireAssigneeOrAdmin error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const addAttachments = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params; // task id

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    // Create attachments
    const created = await prisma.$transaction(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            name: file.originalname,
            url: `/uploads/${file.filename}`,
            taskId: id,
            uploaderId: req.user!.id,
          },
          include: {
            uploader: { select: { id: true, fullName: true, email: true, username: true, role: true, avatarUrl: true, phone: true } },
          },
        })
      )
    );

    return res.status(201).json(created);
  } catch (error: any) {
    console.error('addAttachments error', error);
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};