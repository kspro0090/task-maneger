import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- TYPE DEFINITIONS ---
type UserRole = 'admin' | 'staff' | 'viewer';
type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done' | 'returned' | 'approved' | 'rejected';
type TaskPriority = 'low' | 'medium' | 'high';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  username: string;
  password: string; // In a real app, this should be a hash
}

interface Attachment {
  id: string;
  name: string;
  url: string; // In a real app, this would be a signed URL from a storage service
  uploaderId: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assigneeIds: string[];
  status: TaskStatus;
  notes?: string;
  attachments: Attachment[];
  chatMessages: ChatMessage[];
}

// --- MOCK DATA ---
const mockUsers: User[] = [
  { id: 'u1', fullName: 'آرش مدیر', email: 'admin@example.com', phone: '09120000001', role: 'admin', avatarUrl: 'https://i.pravatar.cc/150?u=u1', username: 'admin', password: 'password123' },
  { id: 'u2', fullName: 'زهرا کارمند', email: 'zahra@example.com', phone: '09120000002', role: 'staff', avatarUrl: 'https://i.pravatar.cc/150?u=u2', username: 'zahra', password: 'password123' },
  { id: 'u3', fullName: 'بابک کارمند', email: 'babak@example.com', phone: '09120000003', role: 'staff', avatarUrl: 'https://i.pravatar.cc/150?u=u3', username: 'babak', password: 'password123' },
];

const mockTasks: Task[] = [
  { id: 't1', title: 'طراحی صفحه ورود', description: 'ایجاد ماکاپ و UI نهایی برای صفحه لاگین کاربران.', priority: 'high', dueDate: '2024-08-15', assigneeIds: ['u2'], status: 'doing', notes: 'طرح اولیه در فیگما آماده است.', attachments: [], chatMessages: [] },
  { id: 't2', title: 'آماده‌سازی گزارش هفتگی', description: 'جمع‌آوری داده‌های فروش و عملکرد تیم در هفته گذشته.', priority: 'medium', dueDate: '2024-08-12', assigneeIds: ['u3'], status: 'todo', attachments: [], chatMessages: [] },
  { id: 't3', title: 'اصلاح باگ نمایش تاریخ', description: 'در پروفایل کاربری تاریخ تولد به اشتباه نمایش داده می‌شود.', priority: 'high', dueDate: '2024-08-11', assigneeIds: ['u2'], status: 'done', attachments: [], chatMessages: [] },
  { id: 't4', title: 'بررسی و تایید تسک #3', description: 'تسک "اصلاح باگ نمایش تاریخ" که توسط زهرا انجام شده باید بررسی و تایید نهایی شود.', priority: 'medium', dueDate: '2024-08-12', assigneeIds: ['u1'], status: 'done', attachments: [], chatMessages: [] },
  { id: 't5', title: 'نوشتن مستندات API', description: 'توضیح کامل اندپوینت‌های کاربران و تسک‌ها در Postman.', priority: 'low', dueDate: '2024-08-20', assigneeIds: ['u3'], status: 'backlog', attachments: [], chatMessages: [] },
  { id: 't6', title: 'پاسخ به تیکت‌های پشتیبانی', description: 'پاسخ به تمام تیکت‌های باز مانده از هفته گذشته.', priority: 'high', dueDate: '2024-08-10', assigneeIds: ['u2'], status: 'approved', attachments: [{id: 'a1', name: 'log.txt', uploaderId: 'u2', url: '#'}], chatMessages: [] },
  { id: 't7', title: 'برنامه‌ریزی اسپرینت بعدی', description: 'جلسه با تیم محصول برای اولویت‌بندی تسک‌های اسپرینت آینده.', priority: 'medium', dueDate: '2024-08-18', assigneeIds: ['u1'], status: 'todo', attachments: [], chatMessages: [] },
  { id: 't8', title: 'آپدیت کردن وابستگی‌های پروژه', description: 'اجرای npm install برای به‌روزرسانی پکیج‌های سمت فرانت‌اند و بک‌اند.', priority: 'low', dueDate: '2024-08-25', assigneeIds: ['u3'], status: 'backlog', attachments: [], chatMessages: [] },
  { id: 't9', title: 'تست تسک گروهی', description: 'این تسک به صورت مشترک به زهرا و بابک تخصیص داده شده است.', priority: 'medium', dueDate: '2024-08-22', assigneeIds: ['u2', 'u3'], status: 'returned', attachments: [], chatMessages: [
      { id: 'cm1', userId: 'u2', text: 'سلام بابک، از کدوم بخش شروع کنیم؟', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { id: 'cm2', userId: 'u3', text: 'سلام زهرا. من بخش تست فرانت‌اند رو برمی‌دارم.', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString() }
  ]},
];


// --- UTILITIES ---
const STATUS_CONFIG: Record<TaskStatus, { title: string; order: number }> = {
  backlog: { title: 'بک‌لاگ', order: 1 },
  todo: { title: 'برای انجام', order: 2 },
  doing: { title: 'در حال انجام', order: 3 },
  done: { title: 'انجام شده', order: 4 },
  returned: { title: 'برگشت خورده', order: 5 },
  approved: { title: 'تایید شده', order: 6 },
  rejected: { title: 'رد شده', order: 7 },
};

// --- COMPONENTS ---

const UserForm: React.FC<{
  userToEdit: User | null;
  onSave: (user: Omit<User, 'id' | 'avatarUrl'> & { id?: string }) => void;
  onCancel: () => void;
}> = ({ userToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', role: 'staff' as UserRole, username: '', password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        fullName: userToEdit.fullName,
        email: userToEdit.email,
        phone: userToEdit.phone,
        role: userToEdit.role,
        username: userToEdit.username,
        password: userToEdit.password
      });
    } else {
      setFormData({ fullName: '', email: '', phone: '', role: 'staff', username: '', password: '' });
    }
  }, [userToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.username.trim() || !formData.password.trim()) {
      alert('لطفا تمام فیلدهای ستاره‌دار را پر کنید.');
      return;
    }
    onSave({ ...formData, id: userToEdit?.id });
  };

  return (
    <div className="personnel-form">
      <h3>{userToEdit ? 'ویرایش پرسنل' : 'افزودن پرسنل جدید'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">نام کامل*</label>
          <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">ایمیل*</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
         <div className="form-group">
          <label htmlFor="username">نام کاربری*</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">رمز عبور*</label>
          <div className="password-input-wrapper">
             <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} required />
             <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                {showPassword ? '👁️' : '🔒'}
             </button>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="phone">شماره تلفن</label>
          <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="role">نقش*</label>
          <select id="role" name="role" value={formData.role} onChange={handleChange} required>
            <option value="staff">کارمند (Staff)</option>
            <option value="admin">مدیر (Admin)</option>
            <option value="viewer">ناظر (Viewer)</option>
          </select>
        </div>
        <div className="form-actions">
           <button type="submit" className="form-submit-button">{userToEdit ? 'ذخیره تغییرات' : 'افزودن کاربر'}</button>
           {userToEdit && <button type="button" className="form-cancel-button" onClick={onCancel}>لغو</button>}
        </div>
      </form>
    </div>
  );
};

const PersonnelModal: React.FC<{
  currentUser: User;
  users: User[];
  onClose: () => void;
  onSaveUser: (user: Omit<User, 'avatarUrl'>) => void;
  onDeleteUser: (userId: string) => void;
}> = ({ currentUser, users, onClose, onSaveUser, onDeleteUser }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleSave = (user: Omit<User, 'id' | 'avatarUrl'> & { id?: string }) => {
    const userToSave = {
      ...user,
      id: user.id || `u${Date.now()}`,
    };
    onSaveUser(userToSave);
    setEditingUser(null);
  };
  
  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
       onDeleteUser(userId);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="بستن">&times;</button>
        <h2>مدیریت پرسنل</h2>
        <div className="personnel-content">
          <div className="personnel-list">
            <h3>پرسنل موجود</h3>
            <ul>
              {users.map(user => (
                <li key={user.id}>
                  <img src={user.avatarUrl} alt={user.fullName} className="assignee-avatar" />
                  <div className="user-info">
                    <strong>{user.fullName}</strong>
                    <span>{user.username} - ({user.role})</span>
                  </div>
                   <div className="user-actions">
                    <button onClick={() => handleEdit(user)} className="action-button edit-btn" title="ویرایش">📝</button>
                    {currentUser.id !== user.id && (
                       <button onClick={() => handleDelete(user.id)} className="action-button delete-btn" title="حذف">🗑️</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <UserForm 
            userToEdit={editingUser}
            onSave={handleSave}
            onCancel={() => setEditingUser(null)}
          />
        </div>
      </div>
    </div>
  );
};

const TaskChat: React.FC<{
  messages: ChatMessage[];
  users: User[];
  currentUser: User;
  onSendMessage: (text: string) => void;
}> = ({ messages, users, currentUser, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getUser = (userId: string) => users.find(u => u.id === userId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(newMessage.trim()){
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chat-container">
            <h4>چت تسک</h4>
            <div className="chat-messages">
                {messages.map(msg => {
                    const sender = getUser(msg.userId);
                    const isSelf = msg.userId === currentUser.id;
                    if(!sender) return null;
                    return (
                        <div key={msg.id} className={`chat-message ${isSelf ? 'is-self' : ''}`}>
                            <img src={sender.avatarUrl} alt={sender.fullName} className="assignee-avatar-small"/>
                            <div className="message-content">
                                {!isSelf && <strong className="message-sender">{sender.fullName}</strong>}
                                <p className="message-text">{msg.text}</p>
                                <time className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</time>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input type="text" placeholder="پیام خود را بنویسید..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button type="submit">ارسال</button>
            </form>
        </div>
    )
}

const TaskAttachments: React.FC<{
    attachments: Attachment[];
    onAddAttachments: (files: FileList) => void;
}> = ({ attachments, onAddAttachments }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="attachments-section">
            <h4>فایل‌های ضمیمه</h4>
            <div className="attachments-list">
                {attachments.map(file => (
                    <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className="attachment-item">
                        📎 {file.name}
                    </a>
                ))}
                {attachments.length === 0 && <p className="no-attachments">هیچ فایلی ضمیمه نشده است.</p>}
            </div>
            <input type="file" multiple ref={fileInputRef} style={{display: 'none'}} onChange={(e) => e.target.files && onAddAttachments(e.target.files)} />
            <button type="button" className="upload-button" onClick={() => fileInputRef.current?.click()}>+ افزودن فایل</button>
        </div>
    )
}

const TaskModal: React.FC<{
    task: Task | null;
    users: User[];
    currentUser: User;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'> & { id?: string }) => void;
}> = ({ task, users, currentUser, onClose, onSave }) => {
    const isNewTask = task === null;
    const [formData, setFormData] = useState<Omit<Task, 'id'>>({
        title: '', description: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], assigneeIds: [], status: 'todo', notes: '', attachments: [], chatMessages: []
    });

    useEffect(() => {
        if (task) {
            setFormData({ ...task });
        } else {
             setFormData({
                title: '', description: '', priority: 'medium', dueDate: new Date().toISOString().split('T')[0], assigneeIds: [], status: 'todo', notes: '', attachments: [], chatMessages: []
            });
        }
    }, [task]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAssigneeChange = (userId: string) => {
        setFormData(prev => {
            const newAssigneeIds = prev.assigneeIds.includes(userId) ? prev.assigneeIds.filter(id => id !== userId) : [...prev.assigneeIds, userId];
            return { ...prev, assigneeIds: newAssigneeIds };
        });
    };
    
    const handleSave = () => {
        if(!formData.title.trim() || formData.assigneeIds.length === 0){
            alert('لطفا عنوان و حداقل یک مسئول برای تسک مشخص کنید.');
            return;
        }
        onSave({ ...formData, id: task?.id });
        onClose();
    };
    
    const handleMarkAsDone = () => {
        onSave({ ...formData, id: task?.id, status: 'done' });
        onClose();
    }

    const handleSendMessage = (text: string) => {
        const newMessage: ChatMessage = {
            id: `cm${Date.now()}`,
            userId: currentUser.id,
            text,
            timestamp: new Date().toISOString()
        };
        setFormData(prev => {
            const updatedData = { ...prev, chatMessages: [...prev.chatMessages, newMessage] };
            onSave({ ...updatedData, id: task?.id });
            return updatedData;
        });
    };

    const handleAddAttachments = (files: FileList) => {
        const newAttachments: Attachment[] = Array.from(files).map(file => ({
            id: `att${Date.now()}${Math.random()}`,
            name: file.name,
            url: URL.createObjectURL(file), // Mock URL for preview
            uploaderId: currentUser.id
        }));
        setFormData(prev => {
            const updatedData = { ...prev, attachments: [...prev.attachments, ...newAttachments] };
            onSave({ ...updatedData, id: task?.id });
            return updatedData;
        });
    };
    
    const canEdit = currentUser.role === 'admin' || isNewTask;
    const isStaff = currentUser.role === 'staff';
    const showChat = isStaff && formData.assigneeIds.length > 1;
    const canMarkAsDone = isStaff && ['todo', 'doing', 'returned'].includes(formData.status);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content task-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose} aria-label="بستن">&times;</button>
                <h2>{isNewTask ? 'افزودن تسک جدید' : 'مشاهده و ویرایش تسک'}</h2>
                <div className="task-form">
                    <div className="task-form-main">
                        <div className="form-group">
                            <label htmlFor="title">عنوان تسک*</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required readOnly={!canEdit} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">توضیحات</label>
                            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} readOnly={!canEdit}></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="notes">یادداشت‌ها و توضیحات کاربر</label>
                            <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} readOnly={isStaff && !canEdit}></textarea>
                        </div>
                        <TaskAttachments attachments={formData.attachments} onAddAttachments={handleAddAttachments} />
                    </div>
                    <div className="task-form-sidebar">
                        <div className="form-group">
                          <label htmlFor="status">وضعیت</label>
                          { isStaff ? (
                              <div className="staff-status-display">{STATUS_CONFIG[formData.status].title}</div>
                          ) : (
                              <select name="status" id="status" value={formData.status} onChange={handleChange}>
                                {Object.entries(STATUS_CONFIG).map(([key, {title}]) => (
                                  <option key={key} value={key}>{title}</option>
                                ))}
                              </select>
                          )}
                        </div>
                        <div className="form-group">
                          <label htmlFor="assigneeIds">مسئولین انجام*</label>
                          <div className="multi-select-container">
                            {users.filter(u => u.role === 'staff').map(user => (
                              <label key={user.id} className="multi-select-option">
                                <input type="checkbox" checked={formData.assigneeIds.includes(user.id)} onChange={() => handleAssigneeChange(user.id)} disabled={!canEdit} />
                                <img src={user.avatarUrl} alt={user.fullName} className="assignee-avatar-small" />
                                {user.fullName}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="priority">اولویت</label>
                          <select name="priority" id="priority" value={formData.priority} onChange={handleChange} disabled={!canEdit}>
                            <option value="low">کم</option>
                            <option value="medium">متوسط</option>
                            <option value="high">زیاد</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="dueDate">تاریخ سررسید</label>
                          <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} readOnly={!canEdit} />
                        </div>
                        {showChat && <TaskChat messages={formData.chatMessages} users={users} currentUser={currentUser} onSendMessage={handleSendMessage} />}
                    </div>
                     <div className="task-form-actions">
                        {canMarkAsDone ? (
                           <button type="button" className="form-submit-button mark-done-btn" onClick={handleMarkAsDone}>تغییر وضعیت به انجام شد</button>
                        ) : (
                           <button type="button" className="form-submit-button" onClick={handleSave}>ذخیره تغییرات</button>
                        )}
                        <button type="button" className="form-cancel-button" onClick={onClose}>بستن</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TaskCard: React.FC<{ task: Task; users: User[]; onClick: () => void }> = ({ task, users, onClick }) => {
  const assignees = useMemo(() =>
    task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[],
    [task.assigneeIds, users]
  );

  const FinalStatusIcon = () => {
    switch (task.status) {
      case 'approved': return <span className="task-final-status approved" title="تایید شده">✅</span>;
      case 'rejected': return <span className="task-final-status rejected" title="رد شده">❌</span>;
      case 'done': return <span className="task-final-status pending" title="در انتظار تایید">⏳</span>;
      default: return null;
    }
  }

  return (
    <div className="task-card" data-priority={task.priority} draggable="true" onClick={onClick}>
      {task.status === 'returned' && <span className="task-returned-badge">برگشتی</span>}
      <h3 className="task-title">{task.title}</h3>
      <div className="task-footer">
        <div className="task-assignees">
          {assignees.map(user => (
             <img key={user.id} src={user.avatarUrl} alt={user.fullName} title={user.fullName} className="assignee-avatar" />
          ))}
        </div>
        <div className="task-meta">
            {task.attachments.length > 0 && <span className="task-attachment-indicator" title={`${task.attachments.length} ضمیمه`}>📎</span>}
            <FinalStatusIcon />
            <span className="due-date">{task.dueDate}</span>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{ title: string; tasks: Task[]; users: User[]; onTaskClick: (task: Task) => void }> = ({ title, tasks, users, onTaskClick }) => {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h2 className="kanban-column-title">{title}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="kanban-column-content">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} users={users} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
};

const Header: React.FC<{ user: User; onThemeToggle: () => void; theme: string; onOpenPersonnelModal: () => void; onOpenNewTaskModal: () => void; onLogout: () => void; }> = ({ user, onThemeToggle, theme, onOpenPersonnelModal, onOpenNewTaskModal, onLogout }) => {
  return (
    <header className="header">
      <h1 className="header-title">سامانه مدیریت تسک</h1>
      <div className="header-controls">
        {user.role === 'admin' && (
          <>
            <button className="header-button" onClick={onOpenNewTaskModal}>
                افزودن تسک جدید
            </button>
            <button className="header-button" onClick={onOpenPersonnelModal}>
                مدیریت پرسنل
            </button>
          </>
        )}
        <div className="user-profile">
          <span className="user-name">{user.fullName}</span>
          <img src={user.avatarUrl} alt={user.fullName} className="user-avatar" />
        </div>
        <button className="header-button" onClick={onLogout}>خروج</button>
        <button className="theme-switcher" onClick={onThemeToggle} aria-label="تغییر تم">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};

const LoginPage: React.FC<{ onLogin: (username: string, password: string) => void; error: string;}> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>ورود به سامانه</h2>
                <div className="form-group">
                    <label htmlFor="username">نام کاربری</label>
                    <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="password">رمز عبور</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="form-submit-button">ورود</button>
            </form>
        </div>
    )
}

const MainApp: React.FC<{
  currentUser: User;
  users: User[];
  tasks: Task[];
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
  onSaveUser: (user: Omit<User, 'avatarUrl'>) => void;
  onDeleteUser: (userId: string) => void;
  onOpenNewTaskModal: () => void;
  onTaskClick: (task: Task) => void;
}> = (props) => {
  const { currentUser, users, tasks, theme, onThemeToggle, onLogout, onSaveUser, onDeleteUser, onOpenNewTaskModal, onTaskClick } = props;
  const [isPersonnelModalOpen, setPersonnelModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'viewer') {
      return tasks;
    }
    return tasks.filter(task => task.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser]);

  const tasksByStatus = useMemo(() => {
    const grouped = {} as Record<TaskStatus, Task[]>;
    for (const status in STATUS_CONFIG) {
        grouped[status as TaskStatus] = [];
    }
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);
  
  const isAdminView = currentUser.role === 'admin' || currentUser.role === 'viewer';

  const renderAdminView = () => {
    const orderedStatuses = Object.keys(STATUS_CONFIG).sort((a, b) => STATUS_CONFIG[a as TaskStatus].order - STATUS_CONFIG[b as TaskStatus].order) as TaskStatus[];
    return orderedStatuses.map(status => (
      <KanbanColumn
        key={status}
        title={STATUS_CONFIG[status].title}
        tasks={tasksByStatus[status] || []}
        users={users}
        onTaskClick={onTaskClick}
      />
    ));
  };

  const renderStaffView = () => {
    const staffColumns = [
      { title: 'کارهای پیش رو', statuses: ['todo', 'returned'] as TaskStatus[] },
      { title: 'در حال انجام', statuses: ['doing'] as TaskStatus[] },
      { title: 'تکمیل شده', statuses: ['done', 'approved', 'rejected'] as TaskStatus[] }
    ];

    return staffColumns.map(col => (
      <KanbanColumn
        key={col.title}
        title={col.title}
        tasks={col.statuses.flatMap(s => tasksByStatus[s] || [])}
        users={users}
        onTaskClick={onTaskClick}
      />
    ));
  };

  return (
    <>
      <Header 
        user={currentUser} 
        onThemeToggle={onThemeToggle} 
        theme={theme} 
        onOpenPersonnelModal={() => setPersonnelModalOpen(true)}
        onOpenNewTaskModal={onOpenNewTaskModal}
        onLogout={onLogout}
        />
      <main className="kanban-board">
        {isAdminView ? renderAdminView() : renderStaffView()}
      </main>
      {isPersonnelModalOpen && (
        <PersonnelModal 
          currentUser={currentUser}
          users={users}
          onClose={() => setPersonnelModalOpen(false)}
          onSaveUser={onSaveUser}
          onDeleteUser={onDeleteUser}
          />
      )}
    </>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = (username: string, password: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if(user) {
        setCurrentUser(user);
        setLoginError('');
    } else {
        setLoginError('نام کاربری یا رمز عبور اشتباه است.');
    }
  }

  const handleLogout = () => {
    setCurrentUser(null);
  }

  const handleSaveUser = (userToSave: Omit<User, 'avatarUrl'>) => {
    setUsers(prevUsers => {
      const existingUserIndex = prevUsers.findIndex(u => u.id === userToSave.id);
      if (existingUserIndex > -1) {
        const updatedUsers = [...prevUsers];
        const oldUser = updatedUsers[existingUserIndex];
        updatedUsers[existingUserIndex] = { ...oldUser, ...userToSave };
        return updatedUsers;
      } else {
        const newAvatar = `https://i.pravatar.cc/150?u=${userToSave.id}`;
        return [...prevUsers, { ...userToSave, id: userToSave.id || `u${Date.now()}`, avatarUrl: newAvatar }];
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
     if(currentUser?.id === userId) {
        alert("شما نمی توانید خودتان را حذف کنید.");
        return;
     }
     setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
     // Also unassign tasks from the deleted user
     setTasks(prevTasks => prevTasks.map(task => ({
        ...task,
        assigneeIds: task.assigneeIds.filter(id => id !== userId)
     })))
  }
  
  const handleOpenNewTaskModal = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  }
  
  const handleSaveTask = (taskToSave: Omit<Task, 'id'> & {id?: string}) => {
    setTasks(prevTasks => {
        const existingTaskIndex = prevTasks.findIndex(t => t.id === taskToSave.id);
        if (existingTaskIndex > -1) {
            const updatedTasks = [...prevTasks];
            updatedTasks[existingTaskIndex] = { ...updatedTasks[existingTaskIndex], ...taskToSave, id: taskToSave.id! };
            return updatedTasks;
        } else {
            const newTask = { ...taskToSave, id: `t${Date.now()}`};
            return [...prevTasks, newTask];
        }
    })
  }

  if (!currentUser) {
      return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  return (
    <>
      <MainApp 
        currentUser={currentUser}
        users={users}
        tasks={tasks}
        theme={theme}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onOpenNewTaskModal={handleOpenNewTaskModal}
        onTaskClick={handleTaskClick}
      />
      {isTaskModalOpen && (
        <TaskModal
          task={selectedTask}
          users={users}
          currentUser={currentUser}
          onClose={() => setTaskModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
};

// --- RENDER ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}