import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, TaskStatus, Recurrence, AdminNotification, TaskLog, TaskComment, TaskAttachment } from '@/lib/types';

interface AppStore extends AppState {
  // Actions
  switchUser: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status' | 'notified' | 'logs' | 'comments'>) => void;
  updateTaskStatus: (id: number, status: TaskStatus) => void;
  toggleTaskCompletion: (id: number) => void;
  toggleMyDay: (id: number) => void;
  deleteTask: (id: number) => void;
  clearMyDay: () => void;
  clearCompleted: () => void;
  toggleTheme: () => void;
  addProject: (name: string) => void;
  addTag: (name: string) => void;
  addUser: (name: string) => string;
  dismissNotification: (id: number) => void;
  trackUsedToken: (type: 'assignees' | 'tags' | 'projects', value: string) => void;
  saveModalDraft: (draft: AppState['modalDraft']) => void;
  clearModalDraft: () => void;
  
  // Global Quick Entry Modal controls
  isQuickEntryOpen: boolean;
  quickEntryDefaults: { dueDate: string | null; project: string | null; };
  openQuickEntry: (defaults?: { dueDate?: string | null; project?: string | null; }) => void;
  closeQuickEntry: () => void;

  // Global Detail Drawer & Admin Alerts actions
  updateTaskFields: (taskId: number, fields: Partial<Task>, changerName: string) => void;
  addTaskComment: (taskId: number, authorName: string, text: string, attachments: TaskAttachment[]) => void;
  openTaskDetail: (taskId: number) => void;
  closeTaskDetail: () => void;
  dismissAdminNotification: (id: string) => void;
  clearAdminNotifications: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const INITIAL_USERS: User[] = [
  { id: 'u_1', name: 'Aditya (Admin)', role: 'admin' },
  { id: 'u_2', name: 'Sarah (User)', role: 'user' },
  { id: 'u_3', name: 'John (User)', role: 'user' }
];

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      tasks: [],
      projects: ['Work', 'Personal', 'Shopping'],
      tags: ['Marketing', 'Urgent', 'Low-effort'],
      theme: 'light',
      karma: 0,
      recentTokens: {
        assignees: [],
        tags: [],
        projects: []
      },
      modalDraft: null,
      adminNotifications: [],
      activeDetailTaskId: null,
      
      // Global Modal State
      isQuickEntryOpen: false,
      quickEntryDefaults: { dueDate: null, project: null },

      switchUser: (id) => {
        const user = get().users.find(u => u.id === id);
        if (user) set({ currentUser: user });
      },

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: Date.now(),
          status: 'pending',
          notified: false,
          logs: [],
          comments: []
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        // Admin Notification
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin') {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${currentUser.name} created a new task: "${newTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: newTask.id,
            read: false
          };
          set((state) => ({
            adminNotifications: [newNotif, ...(state.adminNotifications || [])]
          }));
        }
      },

      updateTaskStatus: (id, status) => {
        const changer = get().currentUser?.name || 'Unknown';
        const oldTask = get().tasks.find(t => t.id === id);
        
        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== id) return t;
            
            const newLog: TaskLog = {
              id: 'log_' + Date.now() + Math.random(),
              text: `changed status from "${oldTask?.status}" to "${status}"`,
              timestamp: new Date().toISOString(),
              type: 'system',
              user: changer
            };

            return { 
              ...t, 
              status,
              logs: [...(t.logs || []), newLog]
            };
          })
        }));

        // Trigger Admin notification if needed
        const updatedTask = get().tasks.find(t => t.id === id);
        if (updatedTask && get().currentUser?.role !== 'admin' && oldTask) {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${changer} changed status of "${oldTask.title}" to "${status}"`,
            timestamp: new Date().toISOString(),
            taskId: id,
            read: false
          };
          set((state) => ({ adminNotifications: [newNotif, ...state.adminNotifications] }));
        }
      },

      toggleTaskCompletion: (id) => {
        const changer = get().currentUser?.name || 'Unknown';
        const oldTask = get().tasks.find(t => t.id === id);

        // DAILY RECURRENCE CONSTRAINT: Cannot complete for future days
        if (oldTask && oldTask.status !== 'completed' && oldTask.recurrence === 'daily' && oldTask.dueDate) {
          const now = new Date();
          const due = new Date(oldTask.dueDate);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
          if (today < dueDay) return;
        }

        const wasCompleted = oldTask?.status === 'completed';

        set((state) => {
          const tasks = state.tasks.map(t => {
            if (t.id !== id) return t;
            
            let newStatus: TaskStatus;
            if (t.status === 'completed') {
              newStatus = 'pending';
            } else {
              const isReview = t.creatorId !== t.assigneeId && state.currentUser?.role !== 'admin';
              newStatus = isReview ? 'review' : 'completed';
            }

            const newLog: TaskLog = {
              id: 'log_' + Date.now() + Math.random(),
              text: newStatus === 'completed' ? 'completed this task' : `marked task as "${newStatus}"`,
              timestamp: new Date().toISOString(),
              type: 'system',
              user: changer
            };

            // Handle recurrence
            if (newStatus === 'completed' && t.recurrence) {
              setTimeout(() => {
                const nextDate = new Date(t.dueDate || new Date());
                if (t.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                if (t.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                if (t.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                
                get().addTask({
                  title: t.title,
                  desc: t.desc,
                  dueDate: nextDate.toISOString().slice(0, 16),
                  dueTime: t.dueTime,
                  priority: t.priority,
                  tags: t.tags,
                  assigneeId: t.assigneeId,
                  creatorId: t.creatorId,
                  reminder: t.reminder,
                  recurrence: t.recurrence,
                  myDay: t.myDay,
                  project: t.project
                });
              }, 500);
            }

            return { 
              ...t, 
              status: newStatus,
              logs: [...(t.logs || []), newLog]
            };
          });

          // Calculate karma
          const isNowCompleted = tasks.find(t => t.id === id)?.status === 'completed';
          let karmaChange = 0;
          if (!wasCompleted && isNowCompleted) karmaChange = 5;
          if (wasCompleted && !isNowCompleted) karmaChange = -5;

          return { tasks, karma: state.karma + karmaChange };
        });

        // Trigger Admin notification if needed
        const updatedTask = get().tasks.find(t => t.id === id);
        if (updatedTask && get().currentUser?.role !== 'admin' && oldTask) {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${changer} toggled completion of "${oldTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: id,
            read: false
          };
          set((state) => ({ adminNotifications: [newNotif, ...state.adminNotifications] }));
        }
      },

      toggleMyDay: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, myDay: !t.myDay } : t)
        }));
      },

      deleteTask: (id) => {
        const oldTask = get().tasks.find(t => t.id === id);
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== id),
          activeDetailTaskId: state.activeDetailTaskId === id ? null : state.activeDetailTaskId
        }));

        // Admin Notification
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin' && oldTask) {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${currentUser.name} deleted task: "${oldTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: id,
            read: false
          };
          set((state) => ({
            adminNotifications: [newNotif, ...(state.adminNotifications || [])]
          }));
        }
      },

      clearMyDay: () => {
        const currentUserId = get().currentUser?.id;
        set((state) => ({
          tasks: state.tasks.map(t => t.assigneeId === currentUserId ? { ...t, myDay: false } : t)
        }));
      },

      clearCompleted: () => {
        const currentUserId = get().currentUser?.id;
        set((state) => ({
          tasks: state.tasks.filter(t => !(t.assigneeId === currentUserId && t.status === 'completed'))
        }));
      },

      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
      },

      addProject: (name) => {
        set((state) => ({ projects: [...state.projects, name] }));
      },

      addTag: (name) => {
        set((state) => ({ tags: [...state.tags, name] }));
      },

      addUser: (name) => {
        const newId = 'u_' + Date.now();
        set((state) => ({
          users: [...state.users, { id: newId, name, role: 'user' }]
        }));
        return newId;
      },

      dismissNotification: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, notified: true } : t)
        }));
      },

      trackUsedToken: (type, value) => {
        set((state) => {
          const recent = state.recentTokens || { assignees: [], tags: [], projects: [] };
          const list = recent[type] || [];
          const filtered = list.filter((item) => item !== value);
          const updated = [value, ...filtered].slice(0, 5);
          return {
            recentTokens: {
              ...recent,
              [type]: updated
            }
          };
        });
      },

      saveModalDraft: (draft) => {
        set({ modalDraft: draft });
      },

      clearModalDraft: () => {
        set({ modalDraft: null });
      },

      openQuickEntry: (defaults) => {
        set({
          isQuickEntryOpen: true,
          quickEntryDefaults: {
            dueDate: defaults?.dueDate || null,
            project: defaults?.project || null
          }
        });
      },

      closeQuickEntry: () => {
        set({ isQuickEntryOpen: false });
      },

      // Update Task Fields (Activity Log generation & Admin notification stack)
      updateTaskFields: (taskId, fields, changerName) => {
        const oldTask = get().tasks.find(t => t.id === taskId);
        if (!oldTask) return;

        const logsToAdd: TaskLog[] = [];
        const changeDescriptions: string[] = [];

        // Compare fields to log exact changes
        Object.keys(fields).forEach((key) => {
          const k = key as keyof Task;
          const oldVal = oldTask[k];
          const newVal = fields[k];

          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            let desc = '';
            // Only log significant changes
            if (['dueDate', 'assigneeId', 'project', 'priority', 'recurrence', 'title'].includes(k)) {
              if (k === 'dueDate') {
                desc = `changed due date from "${oldVal ? new Date(oldVal as string).toLocaleDateString() : 'No date'}" to "${newVal ? new Date(newVal as string).toLocaleDateString() : 'No date'}"`;
              } else if (k === 'assigneeId') {
                const oldUser = get().users.find(u => u.id === oldVal)?.name.split(' (')[0] || 'Unassigned';
                const newUser = get().users.find(u => u.id === newVal)?.name.split(' (')[0] || 'Unassigned';
                desc = `changed assignee from "${oldUser}" to "${newUser}"`;
              } else if (k === 'project') {
                desc = `changed project from "${oldVal || 'None'}" to "${newVal || 'None'}"`;
              } else if (k === 'priority') {
                desc = `changed priority from "${(oldVal as string || 'p4').toUpperCase()}" to "${(newVal as string || 'p4').toUpperCase()}"`;
              } else if (k === 'recurrence') {
                desc = `changed recurrence from "${oldVal || 'None'}" to "${newVal || 'None'}"`;
              } else if (k === 'title') {
                desc = `updated task title to "${newVal}"`;
              }

              if (desc) {
                logsToAdd.push({
                  id: 'log_' + Date.now() + Math.random(),
                  text: desc,
                  timestamp: new Date().toISOString(),
                  type: 'system',
                  user: changerName
                });
                changeDescriptions.push(desc);
              }
            }
          }
        });

        if (logsToAdd.length === 0) return;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              ...fields,
              logs: [...(t.logs || []), ...logsToAdd]
            };
          })
        }));

        // Admin alert if not changed by admin
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin') {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${changerName} updated task "${oldTask.title}": ${changeDescriptions.join(', ')}`,
            timestamp: new Date().toISOString(),
            taskId,
            read: false
          };
          set((state) => ({
            adminNotifications: [newNotif, ...(state.adminNotifications || [])]
          }));
        }
      },

      // Add comments & attachments
      addTaskComment: (taskId, authorName, text, attachments) => {
        const oldTask = get().tasks.find(t => t.id === taskId);
        if (!oldTask) return;

        const newComment: TaskComment = {
          id: 'comment_' + Date.now() + Math.random(),
          author: authorName,
          text,
          timestamp: new Date().toISOString(),
          attachments
        };

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              comments: [...(t.comments || []), newComment]
            };
          })
        }));

        // Admin Notification
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin') {
          const attachDesc = attachments.length > 0 ? ` (+${attachments.length} attachment(s))` : '';
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${authorName} commented on "${oldTask.title}": "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"${attachDesc}`,
            timestamp: new Date().toISOString(),
            taskId,
            read: false
          };
          set((state) => ({
            adminNotifications: [newNotif, ...(state.adminNotifications || [])]
          }));
        }
      },

      openTaskDetail: (taskId) => {
        set({ activeDetailTaskId: taskId });
      },

      closeTaskDetail: () => {
        set({ activeDetailTaskId: null });
      },

      dismissAdminNotification: (id) => {
        set((state) => ({
          adminNotifications: (state.adminNotifications || []).map(n => n.id === id ? { ...n, read: true } : n)
        }));
      },

      clearAdminNotifications: () => {
        set({ adminNotifications: [] });
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      closeSidebar: () => {
        set({ isSidebarOpen: false });
      }
    }),
    {
      name: 'seva-premium-storage',
      // Exclude temporary states from persistence
      partialize: (state) => {
        const { isQuickEntryOpen, quickEntryDefaults, activeDetailTaskId, isSidebarOpen, ...persisted } = state;
        return persisted;
      }
    }
  )
);
