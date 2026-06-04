import { Recurrence } from '@/lib/types';

export function getLocalDateStr(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalIsoDateTime(offset = 0, time = '12:00') {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${time}`;
}

// Checks if a "HH:MM" time has passed today
export function isTimeOverdueToday(dueTimeStr: string | null) {
  if (!dueTimeStr) return false;
  
  const now = new Date();
  const [dueHours, dueMinutes] = dueTimeStr.split(':').map(Number);
  
  const dueTimeToday = new Date();
  dueTimeToday.setHours(dueHours, dueMinutes, 0, 0);
  
  return now > dueTimeToday;
}

// Formats "21:30" into user-friendly "9:30 PM"
export function formatTimeStr(timeStr: string | null) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}