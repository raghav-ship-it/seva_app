import { Recurrence } from '@/lib/types';

export function doesTaskOccurOnDate(dueDate: string | null, recurrence: Recurrence | null, dateStr: string): boolean {
  if (!dueDate) {
    // If no due date but has recurrence, it recurs from today onwards
    if (recurrence) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const target = new Date(`${dateStr}T00:00`);
      const now = new Date();
      
      if (target < now) return false; // Don't show past dates
      
      if (recurrence === 'daily') {
        return true;
      }
      
      if (recurrence === 'weekly') {
        return today.getDay() === target.getDay();
      }
      
      if (recurrence === 'monthly') {
        return today.getDate() === target.getDate();
      }
    }
    return false;
  }

  const dueDateOnly = dueDate.includes('T') ? dueDate.split('T')[0] : dueDate;
  if (dueDateOnly === dateStr) return true;
  if (!recurrence) return false;

  const due = new Date(`${dueDateOnly}T00:00`);
  const target = new Date(`${dateStr}T00:00`);
  if (due > target) return false;

  if (recurrence === 'daily') {
    return true;
  }

  if (recurrence === 'weekly') {
    return due.getDay() === target.getDay();
  }

  if (recurrence === 'monthly') {
    return due.getDate() === target.getDate();
  }

  return false;
}
