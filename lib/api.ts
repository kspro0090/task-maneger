export const API_BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const data = await apiFetch<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function getTasks() {
  return apiFetch('/api/tasks');
}

export async function getUsers() {
  return apiFetch('/api/users');
}

export async function createTask(task: any) {
  return apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTask(id: string, updates: any) {
  return apiFetch(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function createUser(user: any) {
  return apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, updates: any) {
  return apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteUser(id: string) {
  return apiFetch(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function addChatMessage(taskId: string, text: string) {
  return apiFetch(`/api/tasks/${taskId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function uploadAttachment(taskId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const token = localStorage.getItem('token');
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}