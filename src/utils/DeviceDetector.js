/**
 * Device Detection and Performance Profile Management
 * Detects mobile/tablet/desktop devices and provides optimized settings
 */

export class DeviceDetector {
  constructor() {
    this.deviceType = null;
    this.hasTouch = false;
    this.screenSize = null;
    this.performanceProfile = null;

    this.detect();
  }

  /**
   * Perform comprehensive device detection
   */
  detect() {
    this.hasTouch = this.detectTouchCapability();
    this.screenSize = this.getScreenSize();
    this.deviceType = this.detectDeviceType();
    this.performanceProfile = this.getPerformanceProfile();
  }

  /**
   * Re-detect device (useful after orientation changes)
   */
  redetect() {
    this.detect();
  }

  /**
   * Check if device has touch capability
   * @returns {boolean}
   */
  detectTouchCapability() {
    // Multi-factor touch detection
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Get current screen dimensions
   * @returns {object} Screen width and height
   */
  getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Detect device type using multiple factors
   * @returns {string} 'mobile', 'tablet', or 'desktop'
   */
  detectDeviceType() {
    const width = this.screenSize.width;
    const userAgent = navigator.userAgent.toLowerCase();

    // User agent patterns for mobile/tablet devices
    const mobilePattern = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
    const tabletPattern = /ipad|android(?!.*mobile)|tablet|kindle/i;

    // Check user agent first
    const isMobileUA = mobilePattern.test(userAgent);
    const isTabletUA = tabletPattern.test(userAgent);

    // Screen-based detection (prioritize in landscape tablet scenarios)
    if (width <= 768) {
      return 'mobile';
    } else if (width <= 1024 && (this.hasTouch || isTabletUA)) {
      return 'tablet';
    } else if (isMobileUA) {
      // Small screen or mobile user agent
      return 'mobile';
    } else if (isTabletUA) {
      return 'tablet';
    }

    return 'desktop';
  }

  /**
   * Check if device is mobile (phone)
   * @returns {boolean}
   */
  isMobile() {
    return this.deviceType === 'mobile';
  }

  /**
   * Check if device is tablet
   * @returns {boolean}
   */
  isTablet() {
    return this.deviceType === 'tablet';
  }

  /**
   * Check if device is desktop
   * @returns {boolean}
   */
  isDesktop() {
    return this.deviceType === 'desktop';
  }

  /**
   * Check if device is mobile or tablet (i.e., needs mobile UI)
   * @returns {boolean}
   */
  isMobileOrTablet() {
    return this.isMobile() || this.isTablet();
  }

  /**
   * Get device type
   * @returns {string} 'mobile', 'tablet', or 'desktop'
   */
  getDeviceType() {
    return this.deviceType;
  }

  /**
   * Get optimized performance profile for current device
   * @returns {object} Performance settings object
   */
  getPerformanceProfile() {
    switch (this.deviceType) {
      case 'mobile':
        return {
          skip: 60,           // ~1.7% point sampling (reduced for faster loading)
          antialias: false,   // Disable antialiasing for performance
          pixelRatio: 1.0,    // Lower pixel ratio
          pointSize: 0.9,     // Slightly larger points to compensate for fewer points
          powerPreference: 'default',
          precision: 'mediump'
        };

      case 'tablet':
        return {
          skip: 40,           // ~2.5% point sampling (reduced for faster loading)
          antialias: false,   // Still disable AA on tablet GPUs
          pixelRatio: 1.2,    // Moderate pixel ratio
          pointSize: 0.7,     // Slightly larger points to compensate
          powerPreference: 'default',
          precision: 'highp'
        };

      case 'desktop':
      default:
        return {
          skip: 30,           // ~3.3% point sampling (reduced for faster loading)
          antialias: true,    // Enable antialiasing
          pixelRatio: 1.5,    // Higher pixel ratio (capped)
          pointSize: 0.5,     // Smaller points for detail
          powerPreference: 'high-performance',
          precision: 'highp'
        };
    }
  }

  /**
   * Get connection speed estimate (if available)
   * @returns {string|null} 'slow-2g', '2g', '3g', '4g', or null
   */
  getConnectionSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection?.effectiveType || null;
    }
    return null;
  }

  /**
   * Check if connection is slow
   * @returns {boolean}
   */
  isSlowConnection() {
    const speed = this.getConnectionSpeed();
    return speed === 'slow-2g' || speed === '2g';
  }

  /**
   * Get device memory (if available)
   * @returns {number|null} Device memory in GB, or null if unavailable
   */
  getDeviceMemory() {
    return navigator.deviceMemory || null;
  }

  /**
   * Check if device has low memory
   * @returns {boolean}
   */
  isLowMemoryDevice() {
    const memory = this.getDeviceMemory();
    return memory !== null && memory <= 4;
  }

  /**
   * Get recommended file size limit for current device
   * @returns {number} Max file size in MB
   */
  getRecommendedMaxFileSize() {
    switch (this.deviceType) {
      case 'mobile':
        return this.isSlowConnection() ? 50 : 100;
      case 'tablet':
        return 150;
      case 'desktop':
      default:
        return 300;
    }
  }

  /**
   * Get device info summary for debugging
   * @returns {object}
   */
  getDeviceInfo() {
    return {
      type: this.deviceType,
      hasTouch: this.hasTouch,
      screenWidth: this.screenSize.width,
      screenHeight: this.screenSize.height,
      userAgent: navigator.userAgent,
      connection: this.getConnectionSpeed(),
      memory: this.getDeviceMemory(),
      performanceProfile: this.performanceProfile
    };
  }

  /**
   * Log device info to console
   */
  logDeviceInfo() {
    const info = this.getDeviceInfo();
    console.group('🔍 Device Detection');
    console.log(`Device Type: ${info.type}`);
    console.log(`Touch Capable: ${info.hasTouch}`);
    console.log(`Screen: ${info.screenWidth}x${info.screenHeight}`);
    console.log(`Connection: ${info.connection || 'unknown'}`);
    console.log(`Memory: ${info.memory ? `${info.memory}GB` : 'unknown'}`);
    console.log('Performance Profile:', info.performanceProfile);
    console.groupEnd();
  }
}
