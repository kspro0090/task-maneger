import { Request, Response } from 'express';
import { prisma } from '../../../src/config/prisma';
import bcrypt from 'bcrypt';

const sanitizeUser = (user: any) => {
  const { password, ...safe } = user;
  return safe;
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    console.error('getMe error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json(users.map(sanitizeUser));
  } catch (error) {
    console.error('listUsers error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, role, username, password } = req.body as {
      fullName: string; email: string; phone: string; role: 'admin' | 'staff' | 'viewer'; username: string; password: string;
    };

    if (!fullName || !email || !phone || !role || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`;

    const user = await prisma.user.create({
      data: { fullName, email, phone, role, username, password: hashed, avatarUrl },
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (error: any) {
    console.error('createUser error', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...rest } = req.body as any;

    let data: any = { ...rest };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({ where: { id }, data });
    return res.status(200).json(sanitizeUser(user));
  } catch (error: any) {
    console.error('updateUser error', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tasksWithUser = await prisma.task.findMany({
      where: { assignees: { some: { id } } },
      select: { id: true },
    });

    if (tasksWithUser.length > 0) {
      await prisma.$transaction(
        tasksWithUser.map((t) =>
          prisma.task.update({ where: { id: t.id }, data: { assignees: { disconnect: { id } } } })
        )
      );
    }

    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    console.error('deleteUser error', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};