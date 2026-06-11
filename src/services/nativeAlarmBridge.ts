// Interface for interacting with native OS alarm scheduling APIs
export interface NativeAlarmBridge {
  scheduleAlarm(id: string, triggerTime: Date, label: string): Promise<void>;
  cancelAlarm(id: string): Promise<void>;
  // Potential future methods: snoozeAlarm, getScheduledAlarms
}

// Placeholder for actual implementation (e.g., Capacitor plugins)
export const nativeAlarmBridge: NativeAlarmBridge = {
  scheduleAlarm: async (id, triggerTime, label) => {
    console.log(`Native: Scheduling alarm ${id} at ${triggerTime} with label: ${label}`);
    // Real implementation would call native plugin (e.g., CapacitorLocalNotifications.schedule)
  },
  cancelAlarm: async (id) => {
    console.log(`Native: Cancelling alarm ${id}`);
    // Real implementation would call native plugin
  }
};
