import { AlarmStatus } from './types';

export interface Alarm {
  id: string; // UUID
  user_id: string;
  trigger_time: Date;
  label: string;
  is_recurring: boolean;
  recurrence_rule?: string; // Cron or RRULE
  is_active: boolean;
  status: AlarmStatus; // 'draft' | 'scheduled' | 'fired' | 'dismissed' | 'synced'
  updated_at: Date;
}
