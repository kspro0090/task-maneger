import db from '../config/database';
import { User, UserCreate, UserUpdate } from './types';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  static async findAll(): Promise<Omit<User, 'password'>[]> {
    const rows = await db.all(`
      SELECT id, full_name, email, username, phone, role, avatar_url, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    return rows.map((row: any) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  static async findById(id: string): Promise<User | null> {
    const row = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      password: row.password,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findByUsername(username: string): Promise<User | null> {
    const row = await db.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      password: row.password,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    const row = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      password: row.password,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async create(userData: UserCreate): Promise<Omit<User, 'password'>> {
    const id = uuidv4();
    const avatarUrl = `https://i.pravatar.cc/150?u=${id}`;
    
    await db.run(`
      INSERT INTO users (id, full_name, email, username, password, phone, role, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userData.fullName, userData.email, userData.username, userData.password, userData.phone, userData.role, avatarUrl]);
    
    const row = await db.get(`
      SELECT id, full_name, email, username, phone, role, avatar_url, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async update(id: string, userData: UserUpdate): Promise<Omit<User, 'password'> | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (userData.fullName !== undefined) {
      fields.push(`full_name = ?`);
      values.push(userData.fullName);
    }
    if (userData.email !== undefined) {
      fields.push(`email = ?`);
      values.push(userData.email);
    }
    if (userData.username !== undefined) {
      fields.push(`username = ?`);
      values.push(userData.username);
    }
    if (userData.password !== undefined) {
      fields.push(`password = ?`);
      values.push(userData.password);
    }
    if (userData.phone !== undefined) {
      fields.push(`phone = ?`);
      values.push(userData.phone);
    }
    if (userData.role !== undefined) {
      fields.push(`role = ?`);
      values.push(userData.role);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    
    await db.run(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = ?
    `, values);
    
    const row = await db.get(`
      SELECT id, full_name, email, username, phone, role, avatar_url, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      role: row.role,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static async delete(id: string): Promise<boolean> {
    // First, remove user from all task assignments
    await db.run('DELETE FROM task_assignees WHERE user_id = ?', [id]);
    
    // Then delete the user
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    return (result.changes || 0) > 0;
  }
}