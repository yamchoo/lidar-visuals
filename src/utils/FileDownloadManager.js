/**
 * File Download Manager
 * Handles on-demand downloading of LIDAR files that aren't bundled with the app
 * Uses Capacitor Filesystem and Preferences for caching
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export class FileDownloadManager {
  constructor() {
    this.downloadedFiles = new Map();  // filename -> local URI
    this.downloadProgress = new Map(); // filename -> progress %
    this.downloadCallbacks = new Map(); // filename -> callback function
    this.init();
  }

  async init() {
    await this.loadCache();
  }

  /**
   * Load cached file locations from storage
   */
  async loadCache() {
    try {
      const { value } = await Preferences.get({ key: 'downloaded_files' });
      if (value) {
        const cached = JSON.parse(value);
        this.downloadedFiles = new Map(Object.entries(cached));
        console.log(`📦 Loaded ${this.downloadedFiles.size} cached file locations`);
      }
    } catch (error) {
      console.error('Failed to load file cache:', error);
    }
  }

  /**
   * Save cached file locations to storage
   */
  async saveCache() {
    try {
      const obj = Object.fromEntries(this.downloadedFiles);
      await Preferences.set({
        key: 'downloaded_files',
        value: JSON.stringify(obj)
      });
    } catch (error) {
      console.error('Failed to save file cache:', error);
    }
  }

  /**
   * Get file from cache or download if not present
   * @param {object} fileInfo - File metadata from manifest
   * @param {function} onProgress - Progress callback (progress, filename)
   * @returns {Promise<string>} Local file URI
   */
  async getOrDownloadFile(fileInfo, onProgress) {
    const { filename, url, size } = fileInfo;

    // Check if already downloaded
    if (this.downloadedFiles.has(filename)) {
      const localPath = this.downloadedFiles.get(filename);

      // Verify file still exists
      const exists = await this.fileExists(localPath);
      if (exists) {
        console.log(`✅ Using cached file: ${filename}`);
        return localPath;
      } else {
        // File was deleted, remove from cache
        console.log(`⚠️ Cached file missing: ${filename}, re-downloading...`);
        this.downloadedFiles.delete(filename);
        await this.saveCache();
      }
    }

    // Check network status before downloading
    const status = await Network.getStatus();
    if (!status.connected) {
      throw new Error('No network connection. Cannot download file.');
    }

    // Download file
    console.log(`⬇️ Downloading ${filename} (${size}MB)...`);
    const localPath = await this.downloadFile(url, filename, (progress) => {
      this.downloadProgress.set(filename, progress);
      if (onProgress) {
        onProgress(progress, filename);
      }
    });

    // Cache the file location
    this.downloadedFiles.set(filename, localPath);
    await this.saveCache();

    console.log(`✅ Downloaded and cached: ${filename}`);
    return localPath;
  }

  /**
   * Download file from URL and save to device storage
   * @param {string} url - Download URL
   * @param {string} filename - Filename to save as
   * @param {function} onProgress - Progress callback
   * @returns {Promise<string>} Local file URI
   */
  async downloadFile(url, filename, onProgress) {
    try {
      // Fetch file data
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get file as blob
      const blob = await response.blob();

      // Convert blob to base64 for Capacitor Filesystem
      const base64 = await this.blobToBase64(blob);

      // Write to app's data directory
      const result = await Filesystem.writeFile({
        path: `lidar-cache/${filename}`,
        data: base64,
        directory: Directory.Data,
        recursive: true  // Create directory if needed
      });

      // Convert file URI for use with loaders.gl
      return Capacitor.convertFileSrc(result.uri);

    } catch (error) {
      console.error(`Failed to download ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Check if file exists at given path
   * @param {string} path - File path to check
   * @returns {Promise<boolean>}
   */
  async fileExists(path) {
    try {
      await Filesystem.stat({
        path: `lidar-cache/${path}`,
        directory: Directory.Data
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert Blob to base64 string
   * @param {Blob} blob
   * @returns {Promise<string>}
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:xxx;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get download progress for a file
   * @param {string} filename
   * @returns {number} Progress percentage (0-100)
   */
  getDownloadProgress(filename) {
    return this.downloadProgress.get(filename) || 0;
  }

  /**
   * Clear all cached files (for testing/debugging)
   */
  async clearCache() {
    try {
      // Clear in-memory cache
      this.downloadedFiles.clear();
      this.downloadProgress.clear();

      // Clear persisted cache
      await Preferences.remove({ key: 'downloaded_files' });

      console.log('🗑️ File cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
