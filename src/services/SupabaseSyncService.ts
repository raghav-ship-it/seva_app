import { db } from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { Alarm } from '../lib/alarmTypes';

export const SupabaseSyncService = {
  async syncPendingAlarms() {
    // 1. Fetch alarms with status != 'synced'
    const pendingAlarms = await db.alarms
      .where('status')
      .notEqual('synced')
      .toArray();

    if (pendingAlarms.length === 0) return;

    // 2. Push to Supabase (upsert)
    // In a real app, handle authentication and conflict resolution here.
    const { error } = await supabase.from('alarms').upsert(
      pendingAlarms.map((alarm) => ({
        ...alarm,
        // Ensure data format matches DB schema
      }))
    );

    if (error) {
      console.error('Sync failed:', error);
      return;
    }

    // 3. Mark as synced locally
    await db.alarms.bulkUpdate(
      pendingAlarms.map((alarm) => ({
        key: alarm.id,
        changes: { status: 'synced' },
      }))
    );

    console.log(`Synced ${pendingAlarms.length} alarms.`);
  },
};
