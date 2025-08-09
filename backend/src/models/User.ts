import pool from '../config/database';
import { User, UserCreate, UserUpdate } from './types';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  static async findAll(): Promise<Omit<User, 'password'>[]> {
    const result = await pool.query(`
      SELECT id, full_name, email, username, phone, role, avatar_url, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    return result.rows.map((row: any) => ({
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
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
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
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
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
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
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
    
    const result = await pool.query(`
      INSERT INTO users (id, full_name, email, username, password, phone, role, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, email, username, phone, role, avatar_url, created_at, updated_at
    `, [id, userData.fullName, userData.email, userData.username, userData.password, userData.phone, userData.role, avatarUrl]);
    
    const row = result.rows[0];
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
    let paramCount = 1;

    if (userData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(userData.fullName);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }
    if (userData.username !== undefined) {
      fields.push(`username = $${paramCount++}`);
      values.push(userData.username);
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${paramCount++}`);
      values.push(userData.password);
    }
    if (userData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(userData.phone);
    }
    if (userData.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(userData.role);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    
    const result = await pool.query(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, full_name, email, username, phone, role, avatar_url, created_at, updated_at
    `, values);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
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
    await pool.query('DELETE FROM task_assignees WHERE user_id = $1', [id]);
    
    // Then delete the user
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    return (result.rowCount || 0) > 0;
  }
}