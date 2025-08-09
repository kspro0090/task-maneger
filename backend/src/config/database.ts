import Database from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Create SQLite database path
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../data.db');

// Create database connection
const sqliteDb = new Database.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable foreign key constraints
sqliteDb.run('PRAGMA foreign_keys = ON');

// Promisify database methods for async/await usage
const db = {
  get: promisify(sqliteDb.get.bind(sqliteDb)) as (sql: string, params?: any[]) => Promise<any>,
  all: promisify(sqliteDb.all.bind(sqliteDb)) as (sql: string, params?: any[]) => Promise<any[]>,
  run: promisify(sqliteDb.run.bind(sqliteDb)) as (sql: string, params?: any[]) => Promise<{ changes?: number; lastID?: number }>,
  close: promisify(sqliteDb.close.bind(sqliteDb)) as () => Promise<void>,
  
  // Transaction helpers
  async beginTransaction() {
    await this.run('BEGIN TRANSACTION');
  },
  
  async commit() {
    await this.run('COMMIT');
  },
  
  async rollback() {
    await this.run('ROLLBACK');
  }
};

// Error handler
sqliteDb.on('error', (err: Error) => {
  console.error('SQLite database error:', err);
});

export default db;