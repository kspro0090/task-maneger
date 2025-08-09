import bcrypt from 'bcrypt';
import pool from './config/database';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 10;

// Mock data from frontend
const mockUsers = [
  { id: 'u1', fullName: 'آرش مدیر', email: 'admin@example.com', phone: '09120000001', role: 'admin', username: 'admin', password: 'password123' },
  { id: 'u2', fullName: 'زهرا کارمند', email: 'zahra@example.com', phone: '09120000002', role: 'staff', username: 'zahra', password: 'password123' },
  { id: 'u3', fullName: 'بابک کارمند', email: 'babak@example.com', phone: '09120000003', role: 'staff', username: 'babak', password: 'password123' },
];

const mockTasks = [
  { 
    id: 't1', 
    title: 'طراحی صفحه ورود', 
    description: 'ایجاد ماکاپ و UI نهایی برای صفحه لاگین کاربران.', 
    priority: 'high', 
    dueDate: '2024-08-15', 
    assigneeIds: ['u2'], 
    status: 'doing', 
    notes: 'طرح اولیه در فیگما آماده است.' 
  },
  { 
    id: 't2', 
    title: 'آماده‌سازی گزارش هفتگی', 
    description: 'جمع‌آوری داده‌های فروش و عملکرد تیم در هفته گذشته.', 
    priority: 'medium', 
    dueDate: '2024-08-12', 
    assigneeIds: ['u3'], 
    status: 'todo' 
  },
  { 
    id: 't3', 
    title: 'اصلاح باگ نمایش تاریخ', 
    description: 'در پروفایل کاربری تاریخ تولد به اشتباه نمایش داده می‌شود.', 
    priority: 'high', 
    dueDate: '2024-08-11', 
    assigneeIds: ['u2'], 
    status: 'done' 
  },
  { 
    id: 't4', 
    title: 'بررسی و تایید تسک #3', 
    description: 'تسک "اصلاح باگ نمایش تاریخ" که توسط زهرا انجام شده باید بررسی و تایید نهایی شود.', 
    priority: 'medium', 
    dueDate: '2024-08-12', 
    assigneeIds: ['u1'], 
    status: 'done' 
  },
  { 
    id: 't5', 
    title: 'نوشتن مستندات API', 
    description: 'توضیح کامل اندپوینت‌های کاربران و تسک‌ها در Postman.', 
    priority: 'low', 
    dueDate: '2024-08-20', 
    assigneeIds: ['u3'], 
    status: 'backlog' 
  },
  { 
    id: 't6', 
    title: 'پاسخ به تیکت‌های پشتیبانی', 
    description: 'پاسخ به تمام تیکت‌های باز مانده از هفته گذشته.', 
    priority: 'high', 
    dueDate: '2024-08-10', 
    assigneeIds: ['u2'], 
    status: 'approved' 
  },
  { 
    id: 't7', 
    title: 'برنامه‌ریزی اسپرینت بعدی', 
    description: 'جلسه با تیم محصول برای اولویت‌بندی تسک‌های اسپرینت آینده.', 
    priority: 'medium', 
    dueDate: '2024-08-18', 
    assigneeIds: ['u1'], 
    status: 'todo' 
  },
  { 
    id: 't8', 
    title: 'آپدیت کردن وابستگی‌های پروژه', 
    description: 'اجرای npm install برای به‌روزرسانی پکیج‌های سمت فرانت‌اند و بک‌اند.', 
    priority: 'low', 
    dueDate: '2024-08-25', 
    assigneeIds: ['u3'], 
    status: 'backlog' 
  },
  { 
    id: 't9', 
    title: 'تست تسک گروهی', 
    description: 'این تسک به صورت مشترک به زهرا و بابک تخصیص داده شده است.', 
    priority: 'medium', 
    dueDate: '2024-08-22', 
    assigneeIds: ['u2', 'u3'], 
    status: 'returned' 
  },
];

const mockChatMessages = [
  { 
    taskId: 't9', 
    userId: 'u2', 
    text: 'سلام بابک، از کدوم بخش شروع کنیم؟' 
  },
  { 
    taskId: 't9', 
    userId: 'u3', 
    text: 'سلام زهرا. من بخش تست فرانت‌اند رو برمی‌دارم.' 
  }
];

const mockAttachments = [
  {
    taskId: 't6',
    name: 'log.txt',
    url: '/uploads/sample-log.txt',
    uploaderId: 'u2'
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM chat_messages');
    await client.query('DELETE FROM attachments');
    await client.query('DELETE FROM task_assignees');
    await client.query('DELETE FROM tasks');
    await client.query('DELETE FROM users');
    
    // Seed users
    console.log('👥 Seeding users...');
    for (const user of mockUsers) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const avatarUrl = `https://i.pravatar.cc/150?u=${user.id}`;
      
      await client.query(`
        INSERT INTO users (id, full_name, email, username, password, phone, role, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [user.id, user.fullName, user.email, user.username, hashedPassword, user.phone, user.role, avatarUrl]);
    }
    
    // Seed tasks
    console.log('📋 Seeding tasks...');
    for (const task of mockTasks) {
      await client.query(`
        INSERT INTO tasks (id, title, description, priority, due_date, status, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [task.id, task.title, task.description, task.priority, task.dueDate, task.status, task.notes || null]);
      
      // Assign users to tasks
      for (const assigneeId of task.assigneeIds) {
        await client.query(`
          INSERT INTO task_assignees (task_id, user_id)
          VALUES ($1, $2)
        `, [task.id, assigneeId]);
      }
    }
    
    // Seed chat messages
    console.log('💬 Seeding chat messages...');
    for (const message of mockChatMessages) {
      const messageId = uuidv4();
      await client.query(`
        INSERT INTO chat_messages (id, task_id, user_id, text)
        VALUES ($1, $2, $3, $4)
      `, [messageId, message.taskId, message.userId, message.text]);
    }
    
    // Seed attachments
    console.log('📎 Seeding attachments...');
    for (const attachment of mockAttachments) {
      const attachmentId = uuidv4();
      await client.query(`
        INSERT INTO attachments (id, task_id, name, url, uploader_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [attachmentId, attachment.taskId, attachment.name, attachment.url, attachment.uploaderId]);
    }
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`👥 Users: ${mockUsers.length}`);
    console.log(`📋 Tasks: ${mockTasks.length}`);
    console.log(`💬 Chat messages: ${mockChatMessages.length}`);
    console.log(`📎 Attachments: ${mockAttachments.length}`);
    
    console.log('\n🔐 Login credentials:');
    console.log('Admin: username=admin, password=password123');
    console.log('Staff 1: username=zahra, password=password123');
    console.log('Staff 2: username=babak, password=password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;