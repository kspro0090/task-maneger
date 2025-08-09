export type UserRole = 'admin' | 'staff' | 'viewer';
export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done' | 'returned' | 'approved' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreate {
  fullName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UserUpdate {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploaderId: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: Date;
  status: TaskStatus;
  notes?: string;
  assigneeIds: string[];
  attachments: Attachment[];
  chatMessages: ChatMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: Date;
  status?: TaskStatus;
  notes?: string;
  assigneeIds: string[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  status?: TaskStatus;
  notes?: string;
  assigneeIds?: string[];
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}