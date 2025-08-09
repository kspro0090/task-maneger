import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/User';
import { UserCreate, UserUpdate } from '../models/types';

const SALT_ROUNDS = 10;

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, username, password, phone, role }: UserCreate = req.body;

    // Validate required fields
    if (!fullName || !email || !username || !password || !role) {
      res.status(400).json({ 
        message: 'Full name, email, username, password, and role are required' 
      });
      return;
    }

    // Check if email or username already exists
    const existingEmailUser = await UserModel.findByEmail(email);
    if (existingEmailUser) {
      res.status(409).json({ message: 'Email already exists' });
      return;
    }

    const existingUsernameUser = await UserModel.findByUsername(username);
    if (existingUsernameUser) {
      res.status(409).json({ message: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userData: UserCreate = {
      fullName,
      email,
      username,
      password: hashedPassword,
      phone,
      role
    };

    const newUser = await UserModel.create(userData);
    res.status(201).json(newUser);

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UserUpdate = req.body;

    // Check if user exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check for email conflicts (if email is being updated)
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailConflict = await UserModel.findByEmail(updateData.email);
      if (emailConflict) {
        res.status(409).json({ message: 'Email already exists' });
        return;
      }
    }

    // Check for username conflicts (if username is being updated)
    if (updateData.username && updateData.username !== existingUser.username) {
      const usernameConflict = await UserModel.findByUsername(updateData.username);
      if (usernameConflict) {
        res.status(409).json({ message: 'Username already exists' });
        return;
      }
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }

    const updatedUser = await UserModel.update(id, updateData);

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(updatedUser);

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const deleted = await UserModel.delete(id);

    if (!deleted) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(204).send();

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};