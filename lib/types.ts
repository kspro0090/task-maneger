// --- TYPE DEFINITIONS ---
export type UserRole = 'admin' | 'staff' | 'viewer';
export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'done' | 'returned' | 'approved' | 'rejected';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string;
  username: string;
  password: string; // In a real app, this should be a hash
}

export interface Attachment {
  id: string;
  name: string;
  url: string; // In a real app, this would be a signed URL from a storage service
  uploaderId: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export interface Task {
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