export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';
export type Priority = 'p1' | 'p2' | 'p3' | 'p4';
export type Recurrence = 'daily' | 'weekly' | 'monthly' | null;

export interface TaskLog {
  id: string;
  text: string;
  timestamp: string;
  type: 'system';
  user: string;
}

export interface TaskAttachment {
  name: string;
  size: string;
}

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  attachments: TaskAttachment[];
}

export interface Task {
  id: number;
  title: string;
  desc: string;
  dueDate: string | null; // ISO string or simple date
  dueTime: string | null; // HH:MM format
  priority: string | null;
  tags: string[];
  assigneeId: string;
  creatorId: string;
  reminder: string | null; // minutes before
  recurrence: Recurrence;
  myDay: boolean;
  status: TaskStatus;
  notified: boolean;
  project: string | null;
  logs: TaskLog[];
  comments: TaskComment[];
}

export interface AdminNotification {
  id: string;
  text: string;
  timestamp: string;
  taskId: number;
  read: boolean;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  tasks: Task[];
  projects: string[];
  tags: string[];
  theme: 'light' | 'dark';
  karma: number;
  recentTokens: {
    assignees: string[];
    tags: string[];
    projects: string[];
  };
  modalDraft: {
    title: string;
    desc: string;
    stagedMeta: {
      assigneeId: string | null;
      projectId: string | null;
      tags: string[];
      priority: Priority | null;
      dueDate: string | null;
      dueTime: string | null;
      reminder: string | null;
      recurrence: Recurrence;
    };
  } | null;
  adminNotifications: AdminNotification[];
  activeDetailTaskId: number | null;
}
