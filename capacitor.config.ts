// @ts-ignore — @capacitor/cli is only available in native build environments
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sovesa.seva',
  appName: 'Seva',
  webDir: 'out', // Next.js static export directory
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#EF4444',
      sound: 'default',
    },
  },
};

export default config;
