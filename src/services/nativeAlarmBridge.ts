/* eslint-disable @typescript-eslint/no-explicit-any */
// Capacitor imports are optional — only present in native builds
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Capacitor } from '@capacitor/core';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NativeAlarmBridge {
  scheduleAlarm(id: string, triggerTime: Date, label: string): Promise<void>;
  cancelAlarm(id: string): Promise<void>;
}

// Stable numeric ID from string (LocalNotifications requires numeric IDs)
function numericId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(31, hash) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export const nativeAlarmBridge: NativeAlarmBridge = {
  async scheduleAlarm(id, triggerTime, label) {
    const platform = (Capacitor as any).getPlatform();

    if (platform === 'ios') {
      // iOS: use @capacitor/local-notifications
      const { display } = await (LocalNotifications as any).checkPermissions();
      if (display !== 'granted') {
        const result = await (LocalNotifications as any).requestPermissions();
        if (result.display !== 'granted') return;
      }
      await (LocalNotifications as any).schedule({
        notifications: [{
          id: numericId(id),
          title: 'Seva Reminder',
          body: label,
          schedule: { at: triggerTime, allowWhileIdle: true },
          sound: 'default',
          extra: { taskId: id },
        }],
      });

    } else if (platform === 'android') {
      // Android: custom AlarmPlugin with SYSTEM_ALERT_WINDOW overlay
      const { registerPlugin } = await import('@capacitor/core' as any);
      const AlarmPlugin = (registerPlugin as any)('SevaAlarm');
      await AlarmPlugin.scheduleAlarm({
        id,
        triggerTimeMs: triggerTime.getTime(),
        label,
      });

    } else {
      // Web fallback: browser Notification API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const delay = triggerTime.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(async () => {
            if (Notification.permission === 'granted') {
              new Notification('Seva Reminder', { body: label });
            }
          }, delay);
        }
      }
    }
  },

  async cancelAlarm(id) {
    const platform = (Capacitor as any).getPlatform();

    if (platform === 'ios') {
      await (LocalNotifications as any).cancel({ notifications: [{ id: numericId(id) }] });

    } else if (platform === 'android') {
      const { registerPlugin } = await import('@capacitor/core' as any);
      const AlarmPlugin = (registerPlugin as any)('SevaAlarm');
      await AlarmPlugin.cancelAlarm({ id });
    }
  },
};
