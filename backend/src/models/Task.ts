import pool from '../config/database';
import { Task, TaskCreate, TaskUpdate, Attachment, ChatMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export class TaskModel {
  static async findAll(): Promise<Task[]> {
    const result = await pool.query(`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', a.id,
              'name', a.name,
              'url', a.url,
              'uploaderId', a.uploader_id,
              'createdAt', a.created_at
            )
          ) FILTER (WHERE a.id IS NOT NULL), 
          '[]'
        ) as attachments,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cm.id,
              'userId', cm.user_id,
              'text', cm.text,
              'timestamp', cm.timestamp
            ) ORDER BY cm.timestamp
          ) FILTER (WHERE cm.id IS NOT NULL), 
          '[]'
        ) as chat_messages,
        COALESCE(
          json_agg(DISTINCT ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL), 
          '[]'
        ) as assignee_ids
      FROM tasks t
      LEFT JOIN attachments a ON t.id = a.task_id
      LEFT JOIN chat_messages cm ON t.id = cm.task_id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    return result.rows.map(this.mapRowToTask);
  }

  static async findByAssigneeId(userId: string): Promise<Task[]> {
    const result = await pool.query(`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', a.id,
              'name', a.name,
              'url', a.url,
              'uploaderId', a.uploader_id,
              'createdAt', a.created_at
            )
          ) FILTER (WHERE a.id IS NOT NULL), 
          '[]'
        ) as attachments,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cm.id,
              'userId', cm.user_id,
              'text', cm.text,
              'timestamp', cm.timestamp
            ) ORDER BY cm.timestamp
          ) FILTER (WHERE cm.id IS NOT NULL), 
          '[]'
        ) as chat_messages,
        COALESCE(
          json_agg(DISTINCT ta2.user_id) FILTER (WHERE ta2.user_id IS NOT NULL), 
          '[]'
        ) as assignee_ids
      FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id AND ta.user_id = $1
      LEFT JOIN attachments a ON t.id = a.task_id
      LEFT JOIN chat_messages cm ON t.id = cm.task_id
      LEFT JOIN task_assignees ta2 ON t.id = ta2.task_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [userId]);

    return result.rows.map(this.mapRowToTask);
  }

  static async findById(id: string): Promise<Task | null> {
    const result = await pool.query(`
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', a.id,
              'name', a.name,
              'url', a.url,
              'uploaderId', a.uploader_id,
              'createdAt', a.created_at
            )
          ) FILTER (WHERE a.id IS NOT NULL), 
          '[]'
        ) as attachments,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', cm.id,
              'userId', cm.user_id,
              'text', cm.text,
              'timestamp', cm.timestamp
            ) ORDER BY cm.timestamp
          ) FILTER (WHERE cm.id IS NOT NULL), 
          '[]'
        ) as chat_messages,
        COALESCE(
          json_agg(DISTINCT ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL), 
          '[]'
        ) as assignee_ids
      FROM tasks t
      LEFT JOIN attachments a ON t.id = a.task_id
      LEFT JOIN chat_messages cm ON t.id = cm.task_id
      LEFT JOIN task_assignees ta ON t.id = ta.task_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);

    if (result.rows.length === 0) return null;

    return this.mapRowToTask(result.rows[0]);
  }

  static async create(taskData: TaskCreate): Promise<Task> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const taskId = uuidv4();
      
      // Create the task
      const taskResult = await client.query(`
        INSERT INTO tasks (id, title, description, priority, due_date, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [taskId, taskData.title, taskData.description, taskData.priority, taskData.dueDate, taskData.status || 'todo', taskData.notes]);

      // Add assignees
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        for (const assigneeId of taskData.assigneeIds) {
          await client.query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [taskId, assigneeId]
          );
        }
      }

      await client.query('COMMIT');
      
      // Fetch the complete task with relations
      const task = await this.findById(taskId);
      return task!;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id: string, taskData: TaskUpdate): Promise<Task | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update task fields if provided
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (taskData.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(taskData.title);
      }
      if (taskData.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(taskData.description);
      }
      if (taskData.priority !== undefined) {
        fields.push(`priority = $${paramCount++}`);
        values.push(taskData.priority);
      }
      if (taskData.dueDate !== undefined) {
        fields.push(`due_date = $${paramCount++}`);
        values.push(taskData.dueDate);
      }
      if (taskData.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(taskData.status);
      }
      if (taskData.notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(taskData.notes);
      }

      if (fields.length > 0) {
        values.push(id);
        await client.query(`
          UPDATE tasks 
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
        `, values);
      }

      // Update assignees if provided
      if (taskData.assigneeIds !== undefined) {
        // Remove all current assignees
        await client.query('DELETE FROM task_assignees WHERE task_id = $1', [id]);
        
        // Add new assignees
        for (const assigneeId of taskData.assigneeIds) {
          await client.query(
            'INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)',
            [id, assigneeId]
          );
        }
      }

      await client.query('COMMIT');
      
      // Fetch the updated task
      return await this.findById(id);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  static async addAttachment(taskId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>): Promise<Attachment> {
    const attachmentId = uuidv4();
    const result = await pool.query(`
      INSERT INTO attachments (id, task_id, name, url, uploader_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [attachmentId, taskId, attachment.name, attachment.url, attachment.uploaderId]);

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      uploaderId: row.uploader_id,
      createdAt: row.created_at
    };
  }

  static async addChatMessage(taskId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const messageId = uuidv4();
    const result = await pool.query(`
      INSERT INTO chat_messages (id, task_id, user_id, text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [messageId, taskId, message.userId, message.text]);

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      text: row.text,
      timestamp: row.timestamp
    };
  }

  private static mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      dueDate: row.due_date,
      status: row.status,
      notes: row.notes,
      assigneeIds: row.assignee_ids || [],
      attachments: row.attachments || [],
      chatMessages: row.chat_messages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}