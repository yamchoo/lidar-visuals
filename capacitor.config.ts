import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lidarvisuals.vancouver',
  appName: 'Vancouver LIDAR Explorer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Development: uncomment to enable live reload
    // url: 'http://192.168.1.X:3000',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,  // Disable web view scrolling for better 3D controls
    limitsNavigationsToAppBoundDomains: true
  },
  android: {
    backgroundColor: '#000000',
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,  // Manually hide after point cloud loads
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#06b6d4',  // Cyan accent color
      iosSpinnerStyle: 'large'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    }
  }
};

export default config;
