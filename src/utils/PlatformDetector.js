/**
 * Platform Detection for Web vs. Native (Capacitor) Apps
 * Detects if running in Capacitor iOS/Android or web browser
 */

import { Capacitor } from '@capacitor/core';

export class PlatformDetector {
  /**
   * Check if running in native Capacitor app
   */
  static isNative() {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if running on iOS (native)
   */
  static isIOS() {
    return Capacitor.getPlatform() === 'ios';
  }

  /**
   * Check if running on Android (native)
   */
  static isAndroid() {
    return Capacitor.getPlatform() === 'android';
  }

  /**
   * Check if running in web browser
   */
  static isWeb() {
    return Capacitor.getPlatform() === 'web';
  }

  /**
   * Get platform name
   */
  static getPlatform() {
    return Capacitor.getPlatform();
  }

  /**
   * Convert web asset path to native file URI
   * @param {string} path - Relative path to asset
   * @returns {string} - Platform-appropriate URI
   */
  static convertFileSrc(path) {
    if (this.isWeb()) {
      return path;
    }
    return Capacitor.convertFileSrc(path);
  }

  /**
   * Log platform information for debugging
   */
  static logPlatformInfo() {
    console.log('🔍 Platform Detection:');
    console.log(`  Platform: ${this.getPlatform()}`);
    console.log(`  Is Native: ${this.isNative()}`);
    console.log(`  Is Web: ${this.isWeb()}`);
    if (this.isNative()) {
      console.log(`  OS: ${this.isIOS() ? 'iOS' : 'Android'}`);
    }
  }
}
