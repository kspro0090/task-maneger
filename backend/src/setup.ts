import fs from 'fs';
import path from 'path';
import db from './config/database';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up SQLite database...');
    
    // Clean up existing database
    console.log('🧹 Cleaning up existing database...');
    try {
      await db.run('DROP TABLE IF EXISTS chat_messages');
      await db.run('DROP TABLE IF EXISTS attachments');
      await db.run('DROP TABLE IF EXISTS task_assignees');
      await db.run('DROP TABLE IF EXISTS tasks');
      await db.run('DROP TABLE IF EXISTS users');
    } catch (error) {
      // Ignore errors during cleanup
      console.log('ℹ️ Cleanup completed (some items may not have existed)');
    }
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'models', 'schema.sqlite.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove comments and split statements more carefully
    const cleanSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    // Split by semicolons but be careful about multi-line statements
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await db.run(statement);
        console.log(`✓ [${i + 1}/${statements.length}] Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        console.error(`✗ [${i + 1}/${statements.length}] Failed to execute: ${statement.substring(0, 50)}...`);
        console.error(`Full statement: ${statement}`);
        console.error(error);
        throw error;
      }
    }
    
    console.log('✅ Database schema created successfully!');
    console.log(`📁 Database file location: ${process.env.SQLITE_DB_PATH || path.join(__dirname, '../data.db')}`);
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

export default setupDatabase;