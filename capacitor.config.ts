import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fleetlogpro.app',
  appName: 'ระบบบันทึกการทำงานและการใช้รถ',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
