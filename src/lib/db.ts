import Dexie, { Table } from 'dexie';
import { Alarm } from './alarmTypes';

export class SevaDatabase extends Dexie {
  alarms!: Table<Alarm>;

  constructor() {
    super('SevaDatabase');
    this.version(1).stores({
      alarms: 'id, user_id, trigger_time, status' // Index fields for efficient querying
    });
  }
}

export const db = new SevaDatabase();
