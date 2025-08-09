import { Request, Response } from 'express';
import { prisma } from '../../../src/config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const sanitizeUser = (user: any) => {
  const { password, ...safe } = user;
  return safe;
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    });

    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};