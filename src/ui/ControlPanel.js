export class ControlPanel {
  constructor({ pointCloudViewer, pathAnimator, pathManager, viewpointManager, cameraPresets, visualizer }) {
    this.pointCloudViewer = pointCloudViewer;
    this.pathAnimator = pathAnimator;
    this.pathManager = pathManager;
    this.viewpointManager = viewpointManager;
    this.cameraPresets = cameraPresets;
    this.visualizer = visualizer;
    this.panel = null;

    this.init();
  }

  init() {
    this.createPanel();
    this.createPanelHeader();

    // Setup mobile-specific behavior
    if (this.visualizer.isMobile) {
      this.setupMobileBehavior();
    }

    this.createControlModeControls();
    this.createColorModeControls();
    this.createPointSizeControl();
    this.createCameraPathControls();
    this.createViewControls();
    // Removed: Camera Position and Camera Presets sections
    this.createPerformanceToggle();
  }

  /**
   * Setup mobile-specific panel behavior (tap to expand/collapse)
   */
  setupMobileBehavior() {
    const header = this.panel.querySelector('.panel-header');

    // Tap header to expand/collapse
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking the minimize button
      if (e.target.classList.contains('minimize-button')) {
        return;
      }

      this.panel.classList.toggle('expanded');
    });

    // Swipe down to collapse (optional enhancement)
    let startY = 0;
    let startTime = 0;

    header.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
      startTime = Date.now();
    }, { passive: true });

    header.addEventListener('touchmove', (e) => {
      const deltaY = e.touches[0].clientY - startY;
      const deltaTime = Date.now() - startTime;

      // If swiping down quickly (>50px in <300ms), collapse panel
      if (deltaY > 50 && deltaTime < 300 && this.panel.classList.contains('expanded')) {
        this.panel.classList.remove('expanded');
      }
    }, { passive: true });
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'control-panel';
    this.panel.className = 'control-panel';
    document.body.appendChild(this.panel);
  }

  createPanelHeader() {
    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('h2');
    title.className = 'panel-title';
    title.textContent = 'Controls';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'minimize-button';
    minimizeBtn.textContent = '−';
    minimizeBtn.title = 'Minimize controls';

    minimizeBtn.addEventListener('click', () => {
      const isMinimized = this.panel.classList.toggle('minimized');
      minimizeBtn.textContent = isMinimized ? '+' : '−';
      minimizeBtn.title = isMinimized ? 'Expand controls' : 'Minimize controls';
    });

    header.appendChild(title);
    header.appendChild(minimizeBtn);
    this.panel.appendChild(header);
  }

  createControlModeControls() {
    const section = this.createSection('Control Mode');

    const modes = [
      { value: 'fps', label: 'FPS (WASD + Mouse)' },
      { value: 'orbit', label: 'Orbit (Mouse)' }
    ];

    const select = document.createElement('select');
    select.className = 'control-select';
    select.value = this.visualizer.controlMode;

    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.visualizer.setControlMode(e.target.value);
    });

    section.appendChild(select);
  }

  createColorModeControls() {
    const section = this.createSection('Color Mode');

    const modes = [
      { value: 'elevation', label: 'Elevation' },
      { value: 'vaporwave', label: 'Vaporwave' },
      { value: 'intensity', label: 'Intensity' },
      { value: 'rgb', label: 'RGB' },
      { value: 'classification', label: 'Classification' }
    ];

    const select = document.createElement('select');
    select.className = 'control-select';

    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.label;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.pointCloudViewer.setColorMode(e.target.value);
    });

    section.appendChild(select);
  }

  createPointSizeControl() {
    const section = this.createSection('Point Size');

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0.5';
    slider.max = '3.0';
    slider.step = '0.1';
    slider.value = '0.5';
    slider.className = 'control-slider';

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = '0.5';

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = value.toFixed(1);
      this.pointCloudViewer.setPointSize(value);
    });

    section.appendChild(slider);
    section.appendChild(valueDisplay);
  }

  createCameraPathControls() {
    const section = this.createSection('Camera Paths');

    const pathNames = this.pathManager.getPathNames();

    const select = document.createElement('select');
    select.className = 'control-select';
    this.pathSelect = select;  // Store reference for later updates

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a path...';
    select.appendChild(defaultOption);

    pathNames.forEach(path => {
      const option = document.createElement('option');
      option.value = path.id;
      option.textContent = path.name;
      option.title = path.description;
      select.appendChild(option);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.className = 'control-button';
    this.pathPlayButton = playButton;  // Store reference
    playButton.addEventListener('click', () => {
      if (select.value) {
        this.pathAnimator.playPath(select.value, () => {
          playButton.textContent = 'Play';
        });
        playButton.textContent = 'Playing...';
      }
    });

    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop';
    stopButton.className = 'control-button';
    stopButton.addEventListener('click', () => {
      this.pathAnimator.stop();
      playButton.textContent = 'Play';
    });

    buttonContainer.appendChild(playButton);
    buttonContainer.appendChild(stopButton);

    section.appendChild(select);
    section.appendChild(buttonContainer);
  }

  // Refresh camera paths dropdown after paths are initialized
  refreshCameraPaths() {
    if (!this.pathSelect) return;

    // Get current selection
    const currentValue = this.pathSelect.value;

    // Clear existing options except the default one
    while (this.pathSelect.options.length > 1) {
      this.pathSelect.remove(1);
    }

    // Get fresh path names from path manager
    const pathNames = this.pathManager.getPathNames();

    // Add all paths to dropdown
    pathNames.forEach(path => {
      const option = document.createElement('option');
      option.value = path.id;
      option.textContent = path.name;
      option.title = path.description;
      this.pathSelect.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (currentValue) {
      this.pathSelect.value = currentValue;
    }

    console.log(`Camera paths refreshed: ${pathNames.length} paths available`);
  }

  createViewControls() {
    const section = this.createSection('View');

    const fullscreenButton = document.createElement('button');
    fullscreenButton.textContent = 'Toggle Fullscreen';
    fullscreenButton.className = 'control-button';

    fullscreenButton.addEventListener('click', () => {
      this.visualizer.toggleFullscreen();
      setTimeout(() => {
        fullscreenButton.textContent = this.visualizer.isFullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen';
      }, 100);
    });

    section.appendChild(fullscreenButton);
  }

  createViewpointControls() {
    const section = this.createSection('Camera Position');

    // Current position display (read-only, updates live)
    const positionDisplay = document.createElement('div');
    positionDisplay.className = 'camera-position-display';
    positionDisplay.textContent = 'Loading...';
    section.appendChild(positionDisplay);

    // Update position display every frame
    const updatePosition = () => {
      if (this.visualizer.camera) {
        const pos = this.visualizer.camera.position;
        const mode = this.visualizer.controlMode;
        positionDisplay.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)} (${mode})`;
      }
      requestAnimationFrame(updatePosition);
    };
    updatePosition();

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy View';
    copyButton.className = 'control-button';
    copyButton.addEventListener('click', async () => {
      const success = await this.viewpointManager.copyToClipboard();
      if (success) {
        copyButton.textContent = 'Copied!';
        setTimeout(() => copyButton.textContent = 'Copy View', 2000);
      } else {
        copyButton.textContent = 'Failed';
        setTimeout(() => copyButton.textContent = 'Copy View', 2000);
      }
    });

    // Paste button
    const pasteButton = document.createElement('button');
    pasteButton.textContent = 'Paste View';
    pasteButton.className = 'control-button';
    pasteButton.addEventListener('click', async () => {
      const success = await this.viewpointManager.pasteFromClipboard();
      if (success) {
        pasteButton.textContent = 'Restored!';
        setTimeout(() => pasteButton.textContent = 'Paste View', 2000);
      } else {
        pasteButton.textContent = 'Failed';
        setTimeout(() => pasteButton.textContent = 'Paste View', 2000);
      }
    });

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(pasteButton);
    section.appendChild(buttonContainer);

    // Save bookmark button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Bookmark';
    saveButton.className = 'control-button';
    saveButton.addEventListener('click', () => {
      const name = prompt('Enter bookmark name:');
      if (name && name.trim() !== '') {
        const success = this.viewpointManager.saveBookmark(name.trim());
        if (success) {
          saveButton.textContent = 'Saved!';
          setTimeout(() => saveButton.textContent = 'Save Bookmark', 2000);
          this.refreshBookmarksList();
        }
      }
    });
    section.appendChild(saveButton);

    // Bookmarks list container
    this.bookmarksContainer = document.createElement('div');
    this.bookmarksContainer.className = 'bookmarks-container';
    section.appendChild(this.bookmarksContainer);

    this.refreshBookmarksList();
  }

  refreshBookmarksList() {
    if (!this.bookmarksContainer) return;

    this.bookmarksContainer.innerHTML = '';
    const bookmarkNames = this.viewpointManager.getBookmarkNames();

    if (bookmarkNames.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'bookmarks-empty';
      emptyMsg.textContent = 'No bookmarks saved';
      this.bookmarksContainer.appendChild(emptyMsg);
      return;
    }

    bookmarkNames.forEach(name => {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';

      const bookmarkName = document.createElement('span');
      bookmarkName.className = 'bookmark-name';
      bookmarkName.textContent = name;
      bookmarkItem.appendChild(bookmarkName);

      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'bookmark-buttons';

      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Load';
      loadBtn.className = 'bookmark-button';
      loadBtn.addEventListener('click', () => {
        this.viewpointManager.loadBookmark(name);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'bookmark-button delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete bookmark "${name}"?`)) {
          this.viewpointManager.deleteBookmark(name);
          this.refreshBookmarksList();
        }
      });

      buttonGroup.appendChild(loadBtn);
      buttonGroup.appendChild(deleteBtn);
      bookmarkItem.appendChild(buttonGroup);

      this.bookmarksContainer.appendChild(bookmarkItem);
    });
  }

  createCameraPresetControls() {
    const section = this.createSection('Camera Presets');

    // First row: Home, Top, Ground
    const row1 = document.createElement('div');
    row1.className = 'preset-row';

    const presets1 = [
      { id: 'home', label: 'Home', description: 'Default aerial view' },
      { id: 'top', label: 'Top', description: 'Top-down plan view' },
      { id: 'ground', label: 'Ground', description: 'Ground-level corner view' }
    ];

    presets1.forEach(preset => {
      const button = document.createElement('button');
      button.textContent = preset.label;
      button.className = 'preset-button';
      button.title = preset.description;
      button.addEventListener('click', () => {
        this.cameraPresets.applyPreset(preset.id);
      });
      row1.appendChild(button);
    });

    section.appendChild(row1);

    // Second row: N, S, E, W
    const row2 = document.createElement('div');
    row2.className = 'preset-row';

    const presets2 = [
      { id: 'north', label: 'N', description: 'View from south' },
      { id: 'south', label: 'S', description: 'View from north' },
      { id: 'east', label: 'E', description: 'View from east' },
      { id: 'west', label: 'W', description: 'View from west' }
    ];

    presets2.forEach(preset => {
      const button = document.createElement('button');
      button.textContent = preset.label;
      button.className = 'preset-button';
      button.title = preset.description;
      button.addEventListener('click', () => {
        this.cameraPresets.applyPreset(preset.id);
      });
      row2.appendChild(button);
    });

    section.appendChild(row2);
  }

  createPerformanceToggle() {
    const section = this.createSection('Performance');

    const toggle = document.createElement('button');
    toggle.textContent = 'Show FPS';
    toggle.className = 'control-button';

    toggle.addEventListener('click', () => {
      const perfMonitor = document.getElementById('performance-monitor');
      if (perfMonitor) {
        const isVisible = perfMonitor.style.display !== 'none';
        perfMonitor.style.display = isVisible ? 'none' : 'block';
        toggle.textContent = isVisible ? 'Show FPS' : 'Hide FPS';
      }
    });

    section.appendChild(toggle);
  }

  createSection(title) {
    const section = document.createElement('div');
    section.className = 'control-section';

    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.className = 'control-heading';
    section.appendChild(heading);

    this.panel.appendChild(section);
    return section;
  }
}
