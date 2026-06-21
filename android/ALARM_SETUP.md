# Android Setup Instructions

## 1. AndroidManifest.xml
Add these inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Add these inside `<application>`:

```xml
<receiver
    android:name="com.sovesa.seva.alarm.AlarmReceiver"
    android:exported="true" />

<service
    android:name="com.sovesa.seva.alarm.AlarmOverlayService"
    android:exported="false"
    android:foregroundServiceType="specialUse" />
```

## 2. MainActivity.kt
Register the plugin in `onCreate`:

```kotlin
import com.sovesa.seva.alarm.AlarmPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AlarmPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

## 3. Request SYSTEM_ALERT_WINDOW permission at runtime
Add this call on app start (e.g. in `ClientLayout` via a Capacitor plugin call,
or in `MainActivity.kt`):

```kotlin
// In MainActivity.kt onCreate, after registerPlugin:
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
    val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:$packageName"))
    startActivityForResult(intent, 1234)
}
```
