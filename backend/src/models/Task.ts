import db from '../config/database';
import { Task, TaskCreate, TaskUpdate, Attachment, ChatMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export class TaskModel {
  static async findAll(): Promise<Task[]> {
    const tasks = await db.all(`
      SELECT * FROM tasks 
      ORDER BY created_at DESC
    `);

    // Get related data for all tasks
    const taskIds = tasks.map(task => task.id);
    const tasksWithRelations = await Promise.all(
      tasks.map(task => this.enrichTaskWithRelations(task))
    );

    return tasksWithRelations;
  }

  static async findByAssigneeId(userId: string): Promise<Task[]> {
    const tasks = await db.all(`
      SELECT t.* FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id AND ta.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);

    const tasksWithRelations = await Promise.all(
      tasks.map(task => this.enrichTaskWithRelations(task))
    );

    return tasksWithRelations;
  }

  static async findById(id: string): Promise<Task | null> {
    const task = await db.get(`
      SELECT * FROM tasks WHERE id = ?
    `, [id]);

    if (!task) return null;

    return await this.enrichTaskWithRelations(task);
  }

  static async create(taskData: TaskCreate): Promise<Task> {
    try {
      await db.beginTransaction();
      
      const taskId = uuidv4();
      
      // Create the task
      await db.run(`
        INSERT INTO tasks (id, title, description, priority, due_date, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [taskId, taskData.title, taskData.description, taskData.priority, taskData.dueDate, taskData.status || 'todo', taskData.notes]);

      // Add assignees
      if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
        for (const assigneeId of taskData.assigneeIds) {
          await db.run(
            'INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)',
            [taskId, assigneeId]
          );
        }
      }

      await db.commit();
      
      // Fetch the complete task with relations
      const task = await this.findById(taskId);
      return task!;
      
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }

  static async update(id: string, taskData: TaskUpdate): Promise<Task | null> {
    try {
      await db.beginTransaction();
      
      // Update task fields if provided
      const fields: string[] = [];
      const values: any[] = [];

      if (taskData.title !== undefined) {
        fields.push(`title = ?`);
        values.push(taskData.title);
      }
      if (taskData.description !== undefined) {
        fields.push(`description = ?`);
        values.push(taskData.description);
      }
      if (taskData.priority !== undefined) {
        fields.push(`priority = ?`);
        values.push(taskData.priority);
      }
      if (taskData.dueDate !== undefined) {
        fields.push(`due_date = ?`);
        values.push(taskData.dueDate);
      }
      if (taskData.status !== undefined) {
        fields.push(`status = ?`);
        values.push(taskData.status);
      }
      if (taskData.notes !== undefined) {
        fields.push(`notes = ?`);
        values.push(taskData.notes);
      }

      if (fields.length > 0) {
        values.push(id);
        await db.run(`
          UPDATE tasks 
          SET ${fields.join(', ')}
          WHERE id = ?
        `, values);
      }

      // Update assignees if provided
      if (taskData.assigneeIds !== undefined) {
        // Remove all current assignees
        await db.run('DELETE FROM task_assignees WHERE task_id = ?', [id]);
        
        // Add new assignees
        for (const assigneeId of taskData.assigneeIds) {
          await db.run(
            'INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)',
            [id, assigneeId]
          );
        }
      }

      await db.commit();
      
      // Fetch the updated task
      return await this.findById(id);
      
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    const result = await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  static async addAttachment(taskId: string, attachment: Omit<Attachment, 'id' | 'createdAt'>): Promise<Attachment> {
    const attachmentId = uuidv4();
    await db.run(`
      INSERT INTO attachments (id, task_id, name, url, uploader_id)
      VALUES (?, ?, ?, ?, ?)
    `, [attachmentId, taskId, attachment.name, attachment.url, attachment.uploaderId]);

    const row = await db.get(`
      SELECT * FROM attachments WHERE id = ?
    `, [attachmentId]);

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
    await db.run(`
      INSERT INTO chat_messages (id, task_id, user_id, text)
      VALUES (?, ?, ?, ?)
    `, [messageId, taskId, message.userId, message.text]);

    const row = await db.get(`
      SELECT * FROM chat_messages WHERE id = ?
    `, [messageId]);

    return {
      id: row.id,
      userId: row.user_id,
      text: row.text,
      timestamp: row.timestamp
    };
  }

  private static async enrichTaskWithRelations(task: any): Promise<Task> {
    // Get attachments
    const attachments = await db.all(`
      SELECT id, name, url, uploader_id, created_at
      FROM attachments WHERE task_id = ?
    `, [task.id]);

    // Get chat messages
    const chatMessages = await db.all(`
      SELECT id, user_id, text, timestamp
      FROM chat_messages WHERE task_id = ? ORDER BY timestamp
    `, [task.id]);

    // Get assignee IDs
    const assignees = await db.all(`
      SELECT user_id FROM task_assignees WHERE task_id = ?
    `, [task.id]);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.due_date,
      status: task.status,
      notes: task.notes,
      assigneeIds: assignees.map(a => a.user_id),
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        url: a.url,
        uploaderId: a.uploader_id,
        createdAt: a.created_at
      })),
      chatMessages: chatMessages.map(cm => ({
        id: cm.id,
        userId: cm.user_id,
        text: cm.text,
        timestamp: cm.timestamp
      })),
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  }
}