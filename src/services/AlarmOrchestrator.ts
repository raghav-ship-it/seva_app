import { db } from '../lib/db';
import { Alarm } from '../lib/alarmTypes';
import { nativeAlarmBridge } from './nativeAlarmBridge';
import { SupabaseSyncService } from './SupabaseSyncService';

export const AlarmOrchestrator = {
  async createAlarm(alarmData: Omit<Alarm, 'status' | 'updated_at'>) {
    const alarm: Alarm = {
      ...alarmData,
      status: 'scheduled',
      updated_at: new Date(),
    };

    // 1. Persist locally
    await db.alarms.add(alarm);

    // 2. Schedule in OS
    await nativeAlarmBridge.scheduleAlarm(alarm.id, alarm.trigger_time, alarm.label);

    // 3. Trigger async sync
    SupabaseSyncService.syncPendingAlarms().catch(console.error);

    console.log(`Alarm ${alarm.id} created and scheduled.`);
    return alarm;
  },

  async cancelAlarm(id: string) {
    // 1. Remove locally
    await db.alarms.delete(id);

    // 2. Cancel in OS
    await nativeAlarmBridge.cancelAlarm(id);

    // 3. Trigger async sync (optional: handle deletion sync on server)
    SupabaseSyncService.syncPendingAlarms().catch(console.error);

    console.log(`Alarm ${id} cancelled.`);
  }
};
