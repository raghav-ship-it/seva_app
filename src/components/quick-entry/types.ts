export type PopoverType = 'schedule' | 'assignee' | 'priority' | 'tags' | 'project' | 'reminder' | 'recurrence' | null;

export interface MetaState {
  assigneeId: string | null;
  projectId: string | null;
  tags: string[];
  priority: 'p1' | 'p2' | 'p3' | 'p4' | null;
  dueDate: string | null;
  dueTime: string | null;
  reminder: string | null;
  recurrence: 'daily' | 'weekly' | 'monthly' | null;
}

export interface MenuItem {
  label: string;
  icon: string;
  val: string | number;
  type?: string;
  class?: string;
  color?: string;
}

export interface Menu {
  items: MenuItem[];
  type: string;
  index: number;
  startPos: number;
}
