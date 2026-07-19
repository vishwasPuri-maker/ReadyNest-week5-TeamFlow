export type Role = 'ADMIN' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  role: Role;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  attachmentUrl: string | null;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  assignee?: { id: string; name: string; avatarUrl: string | null } | null;
  project?: { id: string; name: string };
}

export interface Member {
  membershipId: string;
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  joinedAt?: string;
}

export interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null } | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
