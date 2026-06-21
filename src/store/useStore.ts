import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Task, User, TaskStatus, Recurrence, AdminNotification, TaskLog, TaskComment, TaskAttachment } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { AlarmOrchestrator } from '@/services/AlarmOrchestrator';

function dbTaskToLocal(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    desc: t.description || '',
    dueDate: t.due_date,
    dueTime: t.due_time,
    priority: t.priority,
    tags: t.tags || [],
    assigneeId: t.assignee_id,
    creatorId: t.creator_id,
    reminder: t.reminder,
    recurrence: t.recurrence,
    myDay: t.my_day,
    status: t.status,
    notified: t.notified,
    project: t.project,
    logs: t.logs || [],
    comments: t.comments || [],
  };
}

interface AppStore extends AppState {
  // Actions
  addTask: (task: Omit<Task, 'id' | 'status' | 'notified' | 'logs' | 'comments'>) => Promise<void>;
  updateTaskStatus: (id: number, status: TaskStatus) => void;
  toggleTaskCompletion: (id: number) => Promise<void>;
  toggleMyDay: (id: number) => void;
  deleteTask: (id: number) => Promise<void>;
  clearMyDay: () => void;
  clearCompleted: () => void;
  toggleTheme: () => void;
  addProject: (name: string) => void;
  addTag: (name: string) => void;
  dismissNotification: (id: number) => void;
  trackUsedToken: (type: 'assignees' | 'tags' | 'projects', value: string) => void;
  saveModalDraft: (draft: AppState['modalDraft']) => void;
  clearModalDraft: () => void;
  
  // Global Quick Entry Modal controls
  isQuickEntryOpen: boolean;
  quickEntryDefaults: { dueDate: string | null; project: string | null; myDay: boolean };
  openQuickEntry: (defaults?: { dueDate?: string | null; project?: string | null; myDay?: boolean }) => void;
  closeQuickEntry: () => void;

  // Global Detail Drawer & Admin Alerts actions
  updateTaskFields: (taskId: number, fields: Partial<Task>, changerName: string) => Promise<void>;
  addTaskComment: (taskId: number, authorName: string, text: string, attachments: TaskAttachment[]) => void;
  openTaskDetail: (taskId: number) => void;
  closeTaskDetail: () => void;
  dismissAdminNotification: (id: string) => void;
  clearAdminNotifications: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setActiveFilter: (filter: { type: 'project' | 'tag' | 'all'; value?: string }) => void;
  // Auth & data sync
  setCurrentUser: (user: User | null) => void;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
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
      isSidebarOpen: false,
      activeFilter: { type: 'all' },
      
      // Global Modal State
      isQuickEntryOpen: false,
      quickEntryDefaults: { dueDate: null, project: null, myDay: false },

      addTask: async (taskData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('tasks').insert({
          title: taskData.title,
          description: taskData.desc,
          due_date: taskData.dueDate,
          due_time: taskData.dueTime,
          priority: taskData.priority,
          tags: taskData.tags,
          assignee_id: taskData.assigneeId || user.id,
          creator_id: user.id,
          reminder: taskData.reminder,
          recurrence: taskData.recurrence,
          my_day: taskData.myDay,
          project: taskData.project,
          status: 'pending',
          notified: false,
          logs: [],
          comments: [],
        }).select().single();
        if (error) { console.error('addTask error:', error); return; }
        if (!data) return;

        const newTask = dbTaskToLocal(data);
        set(s => ({ tasks: [newTask, ...s.tasks] }));

        // Schedule alarm if task has a reminder + due date/time
        if (newTask.reminder !== null && newTask.dueDate && newTask.dueTime) {
          const [h, m] = newTask.dueTime.split(':').map(Number);
          const triggerTime = new Date(newTask.dueDate);
          triggerTime.setHours(h, m, 0, 0);
          triggerTime.setMinutes(triggerTime.getMinutes() - Number(newTask.reminder));
          if (triggerTime > new Date()) {
            AlarmOrchestrator.createAlarm({
              id: `task_${newTask.id}`,
              user_id: user.id,
              trigger_time: triggerTime,
              label: newTask.title,
              is_recurring: !!newTask.recurrence,
              is_active: true,
            }).catch(console.error);
          }
        }

        // Admin notification
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin') {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${currentUser.name} created a new task: "${newTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: newTask.id,
            read: false,
          };
          set(s => ({ adminNotifications: [newNotif, ...(s.adminNotifications || [])] }));
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

      toggleTaskCompletion: async (id) => {
        const changer = get().currentUser?.name || 'Unknown';
        const oldTask = get().tasks.find(t => t.id === id);
        if (!oldTask) return;

        // DAILY RECURRENCE CONSTRAINT: Cannot complete for future days
        if (oldTask.status !== 'completed' && oldTask.recurrence === 'daily' && oldTask.dueDate) {
          const today = new Date(); today.setHours(0,0,0,0);
          const due = new Date(oldTask.dueDate); due.setHours(0,0,0,0);
          if (today < due) return;
        }

        const wasCompleted = oldTask.status === 'completed';
        let newStatus: TaskStatus;
        if (wasCompleted) {
          newStatus = 'pending';
        } else {
          const isReview = oldTask.creatorId !== oldTask.assigneeId && get().currentUser?.role !== 'admin';
          newStatus = isReview ? 'review' : 'completed';
        }

        const newLog: TaskLog = {
          id: 'log_' + Date.now() + Math.random(),
          text: newStatus === 'completed' ? 'completed this task' : `marked task as "${newStatus}"`,
          timestamp: new Date().toISOString(),
          type: 'system',
          user: changer,
        };
        const updatedLogs = [...(oldTask.logs || []), newLog];

        await supabase.from('tasks').update({ status: newStatus, logs: updatedLogs }).eq('id', id);

        // Handle recurrence: spawn next task
        if (newStatus === 'completed' && oldTask.recurrence) {
          const nextDate = new Date(oldTask.dueDate || new Date());
          if (oldTask.recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          if (oldTask.recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          if (oldTask.recurrence === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          setTimeout(() => get().addTask({
            title: oldTask.title, desc: oldTask.desc,
            dueDate: nextDate.toISOString().slice(0, 10),
            dueTime: oldTask.dueTime, priority: oldTask.priority,
            tags: oldTask.tags, assigneeId: oldTask.assigneeId,
            creatorId: oldTask.creatorId, reminder: oldTask.reminder,
            recurrence: oldTask.recurrence, myDay: oldTask.myDay, project: oldTask.project,
          }), 500);
        }

        const karmaChange = !wasCompleted && newStatus === 'completed' ? 5 : wasCompleted ? -5 : 0;
        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, status: newStatus, logs: updatedLogs } : t),
          karma: s.karma + karmaChange,
        }));

        if (get().currentUser?.role !== 'admin') {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${changer} toggled completion of "${oldTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: id, read: false,
          };
          set(s => ({ adminNotifications: [newNotif, ...s.adminNotifications] }));
        }
      },

      toggleMyDay: (id) => {
        set((state) => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, myDay: !t.myDay } : t)
        }));
      },

      deleteTask: async (id) => {
        const oldTask = get().tasks.find(t => t.id === id);
        await supabase.from('tasks').delete().eq('id', id);
        // Cancel any scheduled alarm for this task
        AlarmOrchestrator.cancelAlarm(`task_${id}`).catch(console.error);
        set(s => ({
          tasks: s.tasks.filter(t => t.id !== id),
          activeDetailTaskId: s.activeDetailTaskId === id ? null : s.activeDetailTaskId,
        }));
        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin' && oldTask) {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${currentUser.name} deleted task: "${oldTask.title}"`,
            timestamp: new Date().toISOString(),
            taskId: id, read: false,
          };
          set(s => ({ adminNotifications: [newNotif, ...(s.adminNotifications || [])] }));
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
            project: defaults?.project || null,
            myDay: defaults?.myDay || false
          }
        });
      },

      closeQuickEntry: () => {
        set({ isQuickEntryOpen: false });
      },

      // Update Task Fields (Activity Log generation & Admin notification stack)
      updateTaskFields: async (taskId, fields, changerName) => {
        const oldTask = get().tasks.find(t => t.id === taskId);
        if (!oldTask) return;

        const logsToAdd: TaskLog[] = [];
        const changeDescriptions: string[] = [];

        Object.keys(fields).forEach((key) => {
          const k = key as keyof Task;
          const oldVal = oldTask[k];
          const newVal = fields[k];
          if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return;

          let desc = '';
          if (k === 'dueDate') desc = `changed due date from "${oldVal ? new Date(oldVal as string).toLocaleDateString() : 'No date'}" to "${newVal ? new Date(newVal as string).toLocaleDateString() : 'No date'}"`;
          else if (k === 'assigneeId') {
            const oldUser = get().users.find(u => u.id === oldVal)?.name.split(' (')[0] || 'Unassigned';
            const newUser = get().users.find(u => u.id === newVal)?.name.split(' (')[0] || 'Unassigned';
            desc = `changed assignee from "${oldUser}" to "${newUser}"`;
          } else if (k === 'project') desc = `changed project from "${oldVal || 'None'}" to "${newVal || 'None'}"`;
          else if (k === 'priority') desc = `changed priority from "${(oldVal as string || 'p4').toUpperCase()}" to "${(newVal as string || 'p4').toUpperCase()}"`;
          else if (k === 'recurrence') desc = `changed recurrence from "${oldVal || 'None'}" to "${newVal || 'None'}"`;
          else if (k === 'title') desc = `updated task title to "${newVal}"`;

          if (desc) {
            logsToAdd.push({ id: 'log_' + Date.now() + Math.random(), text: desc, timestamp: new Date().toISOString(), type: 'system', user: changerName });
            changeDescriptions.push(desc);
          }
        });

        if (logsToAdd.length === 0) return;

        // Build DB-shaped update
        const dbFields: any = { updated_at: new Date().toISOString() };
        if ('title' in fields) dbFields.title = fields.title;
        if ('status' in fields) dbFields.status = fields.status;
        if ('myDay' in fields) dbFields.my_day = fields.myDay;
        if ('dueDate' in fields) dbFields.due_date = fields.dueDate;
        if ('dueTime' in fields) dbFields.due_time = fields.dueTime;
        if ('priority' in fields) dbFields.priority = fields.priority;
        if ('tags' in fields) dbFields.tags = fields.tags;
        if ('project' in fields) dbFields.project = fields.project;
        if ('reminder' in fields) dbFields.reminder = fields.reminder;
        if ('recurrence' in fields) dbFields.recurrence = fields.recurrence;
        if ('assigneeId' in fields) dbFields.assignee_id = fields.assigneeId;
        dbFields.logs = [...(oldTask.logs || []), ...logsToAdd];

        await supabase.from('tasks').update(dbFields).eq('id', taskId);

        set(s => ({
          tasks: s.tasks.map(t => t.id !== taskId ? t : { ...t, ...fields, logs: dbFields.logs })
        }));

        // Reschedule alarm if time-sensitive fields changed
        const alarmFields = ['reminder', 'dueDate', 'dueTime'];
        if (alarmFields.some(f => f in fields)) {
          const updatedTask = { ...oldTask, ...fields };
          AlarmOrchestrator.cancelAlarm(`task_${taskId}`).catch(console.error);
          if (updatedTask.reminder !== null && updatedTask.dueDate && updatedTask.dueTime) {
            const [h, m] = updatedTask.dueTime.split(':').map(Number);
            const triggerTime = new Date(updatedTask.dueDate);
            triggerTime.setHours(h, m, 0, 0);
            triggerTime.setMinutes(triggerTime.getMinutes() - Number(updatedTask.reminder));
            const { data: { user } } = await supabase.auth.getUser();
            if (user && triggerTime > new Date()) {
              AlarmOrchestrator.createAlarm({
                id: `task_${taskId}`,
                user_id: user.id,
                trigger_time: triggerTime,
                label: updatedTask.title,
                is_recurring: !!updatedTask.recurrence,
                is_active: true,
              }).catch(console.error);
            }
          }
        }

        const currentUser = get().currentUser;
        if (currentUser && currentUser.role !== 'admin') {
          const newNotif: AdminNotification = {
            id: 'notif_' + Date.now() + Math.random(),
            text: `${changerName} updated task "${oldTask.title}": ${changeDescriptions.join(', ')}`,
            timestamp: new Date().toISOString(),
            taskId, read: false,
          };
          set(s => ({ adminNotifications: [newNotif, ...(s.adminNotifications || [])] }));
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
      },
      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
      },

      setCurrentUser: (user) => set({ currentUser: user }),

      logout: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null, users: [], tasks: [], projects: [], tags: [] });
      },

      fetchUserData: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        let { data: profile, error: profileError } = await supabase.from('profiles').select('id, name, role').eq('id', user.id).single();
        
        if (profileError && profileError.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: 'user'
            })
            .select('id, name, role')
            .single();
          if (!insertError) {
            profile = newProfile;
            profileError = null;
          }
        }
        
        if (profileError || !profile) return;

        const tasksQuery = profile.role === 'admin'
          ? supabase.from('tasks').select('*')
          : supabase.from('tasks').select('*').eq('assignee_id', user.id);

        const [{ data: tasks }, { data: projects }, { data: tags }, { data: profiles }] = await Promise.all([
          tasksQuery,
          supabase.from('projects').select('name'),
          supabase.from('tags').select('name'),
          supabase.from('profiles').select('id, name, role'),
        ]);

        set({
          currentUser: { id: profile.id, name: profile.name, role: profile.role },
          users: (profiles || []).map((p: any) => ({ id: p.id, name: p.name, role: p.role })),
          tasks: (tasks || []).map(dbTaskToLocal),
          projects: (projects || []).map((p: any) => p.name),
          tags: (tags || []).map((t: any) => t.name),
        });
      },
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
