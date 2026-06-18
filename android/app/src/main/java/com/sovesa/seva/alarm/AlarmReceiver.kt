package com.sovesa.seva.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager

class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarm_id") ?: return
        val label = intent.getStringExtra("alarm_label") ?: "Reminder"

        // Acquire a brief wake lock so the overlay can launch
        val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        val wl = pm.newWakeLock(
            PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
            "seva:alarm"
        )
        wl.acquire(10_000L) // 10 seconds, overlay will release it

        val serviceIntent = Intent(context, AlarmOverlayService::class.java).apply {
            putExtra("alarm_id", alarmId)
            putExtra("alarm_label", label)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
