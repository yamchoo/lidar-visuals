export class ViewpointManager {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.bookmarks = this.loadBookmarksFromLocalStorage();
    this.setupURLWatcher();
  }

  // Capture current camera state
  captureViewpoint(name = null) {
    const camera = this.visualizer.camera;
    const mode = this.visualizer.controlMode;

    return {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      target: mode === 'orbit' ? {
        x: this.visualizer.orbitControls.target.x,
        y: this.visualizer.orbitControls.target.y,
        z: this.visualizer.orbitControls.target.z
      } : null,
      controlMode: mode,
      timestamp: Date.now(),
      name: name || `View ${new Date().toLocaleTimeString()}`
    };
  }

  // Restore camera state
  restoreViewpoint(viewpoint) {
    // Switch to correct control mode first
    if (this.visualizer.controlMode !== viewpoint.controlMode) {
      this.visualizer.setControlMode(viewpoint.controlMode);
    }

    // Apply position and rotation
    this.visualizer.camera.position.set(
      viewpoint.position.x,
      viewpoint.position.y,
      viewpoint.position.z
    );
    this.visualizer.camera.rotation.set(
      viewpoint.rotation.x,
      viewpoint.rotation.y,
      viewpoint.rotation.z
    );

    // Apply orbit target if in orbit mode
    if (viewpoint.controlMode === 'orbit' && viewpoint.target) {
      this.visualizer.orbitControls.target.set(
        viewpoint.target.x,
        viewpoint.target.y,
        viewpoint.target.z
      );
      this.visualizer.orbitControls.update();
    }
  }

  // Compact format: cam:x,y,z|rx,ry,rz|tx,ty,tz|mode
  serializeCompact(viewpoint) {
    const pos = `${viewpoint.position.x.toFixed(1)},${viewpoint.position.y.toFixed(1)},${viewpoint.position.z.toFixed(1)}`;
    const rot = `${viewpoint.rotation.x.toFixed(3)},${viewpoint.rotation.y.toFixed(3)},${viewpoint.rotation.z.toFixed(3)}`;
    const target = viewpoint.target
      ? `${viewpoint.target.x.toFixed(1)},${viewpoint.target.y.toFixed(1)},${viewpoint.target.z.toFixed(1)}`
      : 'null';

    return `cam:${pos}|${rot}|${target}|${viewpoint.controlMode}`;
  }

  deserializeCompact(compactString) {
    try {
      const parts = compactString.replace('cam:', '').split('|');
      if (parts.length !== 4) {
        throw new Error('Invalid format');
      }

      const [posStr, rotStr, targetStr, mode] = parts;

      const [x, y, z] = posStr.split(',').map(Number);
      const [rx, ry, rz] = rotStr.split(',').map(Number);

      const viewpoint = {
        position: { x, y, z },
        rotation: { x: rx, y: ry, z: rz },
        target: null,
        controlMode: mode,
        timestamp: Date.now()
      };

      if (targetStr !== 'null') {
        const [tx, ty, tz] = targetStr.split(',').map(Number);
        viewpoint.target = { x: tx, y: ty, z: tz };
      }

      return viewpoint;
    } catch (error) {
      console.error('Failed to deserialize viewpoint:', error);
      return null;
    }
  }

  // URL hash format
  serializeToURL(viewpoint) {
    const compact = this.serializeCompact(viewpoint);
    const base64 = btoa(compact);
    return `#view=${base64}`;
  }

  deserializeFromURL() {
    try {
      const hash = window.location.hash;
      if (!hash.startsWith('#view=')) return null;

      const base64 = hash.replace('#view=', '');
      const compact = atob(base64);
      return this.deserializeCompact(compact);
    } catch (error) {
      console.error('Failed to deserialize URL viewpoint:', error);
      return null;
    }
  }

  // Clipboard operations
  async copyToClipboard() {
    try {
      const viewpoint = this.captureViewpoint();
      const compact = this.serializeCompact(viewpoint);
      const url = `${window.location.origin}${window.location.pathname}${this.serializeToURL(viewpoint)}`;

      // Copy both formats
      await navigator.clipboard.writeText(`${compact}\n\nShareable link: ${url}`);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();

      // Try to parse as compact format
      if (text.startsWith('cam:')) {
        // Extract just the first line if there's a URL too
        const compactString = text.split('\n')[0];
        const viewpoint = this.deserializeCompact(compactString);

        if (viewpoint) {
          this.restoreViewpoint(viewpoint);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
      return false;
    }
  }

  // Bookmark management (localStorage)
  saveBookmark(name) {
    if (!name || name.trim() === '') {
      console.error('Bookmark name cannot be empty');
      return false;
    }

    const viewpoint = this.captureViewpoint(name);
    this.bookmarks[name] = viewpoint;
    localStorage.setItem('lidar-bookmarks', JSON.stringify(this.bookmarks));
    return true;
  }

  loadBookmarksFromLocalStorage() {
    try {
      const stored = localStorage.getItem('lidar-bookmarks');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      return {};
    }
  }

  getBookmarkNames() {
    return Object.keys(this.bookmarks);
  }

  getBookmark(name) {
    return this.bookmarks[name];
  }

  loadBookmark(name) {
    const viewpoint = this.bookmarks[name];
    if (viewpoint) {
      this.restoreViewpoint(viewpoint);
      return true;
    }
    return false;
  }

  deleteBookmark(name) {
    if (this.bookmarks[name]) {
      delete this.bookmarks[name];
      localStorage.setItem('lidar-bookmarks', JSON.stringify(this.bookmarks));
      return true;
    }
    return false;
  }

  // URL hash watcher - automatically load viewpoint from URL on page load
  setupURLWatcher() {
    // Check URL on load (after point cloud loads)
    window.addEventListener('load', () => {
      const viewpoint = this.deserializeFromURL();
      if (viewpoint) {
        // Wait for point cloud to load before restoring viewpoint
        setTimeout(() => {
          if (this.visualizer.pointCloudBounds) {
            this.restoreViewpoint(viewpoint);
          } else {
            // Try again after another delay
            setTimeout(() => this.restoreViewpoint(viewpoint), 1000);
          }
        }, 500);
      }
    });

    // Also watch for hash changes during session
    window.addEventListener('hashchange', () => {
      const viewpoint = this.deserializeFromURL();
      if (viewpoint) {
        this.restoreViewpoint(viewpoint);
      }
    });
  }
}
