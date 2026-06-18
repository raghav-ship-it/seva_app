package com.sovesa.seva.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.LayoutInflater
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.sovesa.seva.R

class AlarmOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: android.view.View? = null

    companion object {
        const val CHANNEL_ID = "seva_alarm_channel"
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val alarmId = intent?.getStringExtra("alarm_id") ?: return START_NOT_STICKY
        val label = intent.getStringExtra("alarm_label") ?: "Reminder"

        // Mandatory foreground notification (required for foreground service)
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Seva Alarm")
            .setContentText(label)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        startForeground(alarmId.hashCode(), notification)

        if (Settings.canDrawOverlays(this)) {
            showOverlay(alarmId, label)
        }

        return START_NOT_STICKY
    }

    private fun showOverlay(alarmId: String, label: String) {
        val inflater = LayoutInflater.from(this)
        val view = inflater.inflate(R.layout.alarm_overlay, null)

        view.findViewById<TextView>(R.id.alarm_label).text = label

        view.findViewById<Button>(R.id.btn_dismiss).setOnClickListener {
            removeOverlay()
            stopSelf()
        }

        view.findViewById<Button>(R.id.btn_snooze).setOnClickListener {
            removeOverlay()
            // Re-schedule 5 minutes later
            val snoozeIntent = Intent(this, AlarmReceiver::class.java).apply {
                putExtra("alarm_id", alarmId)
                putExtra("alarm_label", label)
            }
            // Use AlarmManager for snooze
            val am = getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
            val pi = android.app.PendingIntent.getBroadcast(
                this, alarmId.hashCode() + 1, snoozeIntent,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            val snoozeTime = System.currentTimeMillis() + 5 * 60 * 1000L
            am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, snoozeTime, pi)
            stopSelf()
        }

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_ALERT

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    or WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
            PixelFormat.TRANSLUCENT
        )

        overlayView = view
        windowManager.addView(view, params)
    }

    private fun removeOverlay() {
        overlayView?.let {
            windowManager.removeView(it)
            overlayView = null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Seva Alarms", NotificationManager.IMPORTANCE_HIGH
            ).apply { description = "Seva task alarms" }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        removeOverlay()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
