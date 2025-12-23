import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { PointCloudViewer } from './viewer/PointCloudViewer.js';
import { PathAnimator } from './animation/PathAnimator.js';
import { CameraPathManager } from './animation/CameraPathManager.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { ViewpointManager } from './utils/ViewpointManager.js';
import { getDataUrl } from './config/blobUrls.js';
import './ui/styles.css';

class LiDARVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.controlMode = 'fps';
    this.pointCloudViewer = null;
    this.pathAnimator = null;
    this.pathManager = null;
    this.controlPanel = null;
    this.performanceMonitor = null;
    this.viewpointManager = null;
    this.cameraPresets = null;
    this.clock = new THREE.Clock();
    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };
    this.moveSpeed = 300;  // Faster FPS movement
    this.isControlsLocked = false;
    this.pointCloudCenter = null;
    this.pointCloudBounds = null;
    this.orbitCenterIndicator = null;

    this.init();
  }

  init() {
    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
    this.setupPointCloudViewer();
    this.setupCameraPathSystem();
    this.setupViewpointSystem();
    this.setupUI();
    this.setupPerformanceMonitor();
    this.setupEventListeners();
    this.setupOrbitCenterControl();
    this.animate();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.set(0, 200, 200);
  }

  setupRenderer() {
    const container = document.getElementById('canvas-container');
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance',  // Use high-performance GPU
      precision: 'highp'                     // High precision shaders
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Cap pixel ratio at 1.5 for better performance on high-DPI displays
    // This reduces rendering resolution while maintaining good visual quality
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    this.renderer.setPixelRatio(pixelRatio);

    console.log(`Renderer pixel ratio: ${pixelRatio} (device: ${window.devicePixelRatio})`);
    container.appendChild(this.renderer.domElement);
  }

  setupControls() {
    // Initialize FPS controls
    this.fpsControls = new PointerLockControls(this.camera, this.renderer.domElement);

    this.fpsControls.addEventListener('lock', () => {
      this.isControlsLocked = true;
    });

    this.fpsControls.addEventListener('unlock', () => {
      this.isControlsLocked = false;
    });

    this.fpsClickHandler = () => {
      if (this.controlMode === 'fps' && !this.isControlsLocked && !this.fpsControls.isLocked) {
        this.fpsControls.lock();
      }
    };
    this.renderer.domElement.addEventListener('click', this.fpsClickHandler);

    // Initialize Orbit controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.screenSpacePanning = true;
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 5000;

    // Set initial control mode
    this.setControlMode(this.controlMode);
  }

  setupPointCloudViewer() {
    this.pointCloudViewer = new PointCloudViewer(this.scene, this.camera, this.renderer);

    // Configure files to load
    // Twelve tiles total (all large files split for memory management):
    const filesToLoad = [
      getDataUrl('bc_092g025_3_4_1_west.laz'),    // Tile 3_4_1 west (30MB)
      getDataUrl('bc_092g025_3_4_1_east.laz'),    // Tile 3_4_1 east (61MB)
      getDataUrl('bc_092g025_3_4_2_west.laz'),    // Tile 3_4_2 west (52MB)
      getDataUrl('bc_092g025_3_4_2_east.laz'),    // Tile 3_4_2 east (39MB)
      getDataUrl('bc_092g025_3_4_3_west.laz'),    // Tile 3_4_3 west (71MB)
      getDataUrl('bc_092g025_3_4_3_middle.laz'),  // Tile 3_4_3 middle (68MB)
      getDataUrl('bc_092g025_3_4_3_east.laz'),    // Tile 3_4_3 east (50MB)
      getDataUrl('bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz'),  // Tile 3_4_4 (30MB)
      getDataUrl('bc_dsm_v12_west.laz'),          // Original tile west (49MB)
      getDataUrl('bc_dsm_v12_east.laz'),          // Original tile east (41MB)
      getDataUrl('bc_092g025_3_2_4_west.laz'),    // Tile 3_2_4 west (42MB)
      getDataUrl('bc_092g025_3_2_4_east.laz')     // Tile 3_2_4 east (42MB)
    ];

    // Single file (for testing):
    // const filesToLoad = getDataUrl('bc_dsm_v12.laz');

    this.pointCloudViewer.load(filesToLoad, (progress, fileNum, totalFiles, currentFile) => {
      this.updateLoadingProgress(progress, fileNum, totalFiles, currentFile);
    }).then((result) => {
      this.hideLoadingOverlay();

      // Handle both single file (returns bounds) and multiple files (returns object with bounds)
      const bounds = result.bounds || result;
      this.centerCameraOnPointCloud(bounds);

      // Initialize camera paths based on actual point cloud bounds
      this.pathManager.initializePaths(bounds);
      console.log('Camera paths initialized for full map extent');

      // Refresh the UI dropdown with newly initialized paths
      this.controlPanel.refreshCameraPaths();

      if (result.failed && result.failed > 0) {
        console.warn(`Loaded ${result.loaded}/${result.loaded + result.failed} files`);
        this.showWarning(`${result.failed} file(s) failed to load`);
      }

      console.log('Point cloud loaded successfully');
    }).catch((error) => {
      console.error('Error loading point cloud:', error);
      this.showError('Failed to load point cloud');
    });
  }

  setupCameraPathSystem() {
    this.pathManager = new CameraPathManager();
    // Pass visualizer so PathAnimator can always access current controls
    this.pathAnimator = new PathAnimator(this.camera, this, this.pathManager);
  }

  setupViewpointSystem() {
    this.viewpointManager = new ViewpointManager(this);
    this.cameraPresets = new CameraPresets(this);
  }

  setupUI() {
    this.controlPanel = new ControlPanel({
      pointCloudViewer: this.pointCloudViewer,
      pathAnimator: this.pathAnimator,
      pathManager: this.pathManager,
      viewpointManager: this.viewpointManager,
      cameraPresets: this.cameraPresets,
      visualizer: this
    });
  }

  setupPerformanceMonitor() {
    this.performanceMonitor = new PerformanceMonitor();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Fullscreen change listeners (cross-browser support)
    document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
    document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange());

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.pathAnimator.stop();
        if (this.controlMode === 'fps' && this.fpsControls.isLocked) {
          this.fpsControls.unlock();
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'w':
          this.moveState.forward = true;
          break;
        case 's':
          this.moveState.backward = true;
          break;
        case 'a':
          this.moveState.left = true;
          break;
        case 'd':
          this.moveState.right = true;
          break;
        case ' ':
          this.moveState.up = true;
          event.preventDefault();
          break;
        case 'shift':
          this.moveState.down = true;
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch (event.key.toLowerCase()) {
        case 'w':
          this.moveState.forward = false;
          break;
        case 's':
          this.moveState.backward = false;
          break;
        case 'a':
          this.moveState.left = false;
          break;
        case 'd':
          this.moveState.right = false;
          break;
        case ' ':
          this.moveState.up = false;
          break;
        case 'shift':
          this.moveState.down = false;
          break;
      }
    });
  }

  setControlMode(mode) {
    this.controlMode = mode;

    if (mode === 'fps') {
      // Activate FPS controls
      this.controls = this.fpsControls;
      this.orbitControls.enabled = false;
      this.fpsControls.enabled = true;

      // Position camera near ground level if point cloud is loaded
      if (this.pointCloudCenter && this.pointCloudBounds) {
        const size = Math.max(
          this.pointCloudBounds.maxx - this.pointCloudBounds.minx,
          this.pointCloudBounds.maxz - this.pointCloudBounds.minz
        );

        // Position camera at corner looking across terrain
        const edgeX = this.pointCloudBounds.minx + (size * 0.15);  // 15% from X edge
        const edgeZ = this.pointCloudBounds.minz + (size * 0.15);  // 15% from Z edge
        const height = this.pointCloudBounds.miny + 100;            // 100 units above minimum elevation

        this.camera.position.set(edgeX, height, edgeZ);

        // Calculate look direction toward opposite corner
        const targetX = this.pointCloudBounds.maxx - (size * 0.15);
        const targetZ = this.pointCloudBounds.maxz - (size * 0.15);
        const lookTarget = new THREE.Vector3(targetX, height, targetZ);

        this.camera.lookAt(lookTarget);
      }
    } else if (mode === 'orbit') {
      // Activate Orbit controls
      this.controls = this.orbitControls;
      this.fpsControls.enabled = false;
      if (this.fpsControls.isLocked) {
        this.fpsControls.unlock();
      }
      this.orbitControls.enabled = true;

      // Reset camera to aerial view if point cloud is loaded
      if (this.pointCloudCenter && this.pointCloudBounds) {
        const size = Math.max(
          this.pointCloudBounds.maxx - this.pointCloudBounds.minx,
          this.pointCloudBounds.maxy - this.pointCloudBounds.miny,
          this.pointCloudBounds.maxz - this.pointCloudBounds.minz
        );
        const distance = size * 1.5;

        this.camera.position.set(
          this.pointCloudCenter.x,
          this.pointCloudCenter.y + distance * 0.7,
          this.pointCloudCenter.z + distance * 0.7
        );

        this.orbitControls.target.copy(this.pointCloudCenter);
        this.orbitControls.update();
      }
    }
  }

  centerCameraOnPointCloud(bbox) {
    if (!bbox) return;

    // Store bounds for later use
    this.pointCloudBounds = bbox;

    const center = new THREE.Vector3();
    center.x = (bbox.minx + bbox.maxx) / 2;
    center.y = (bbox.miny + bbox.maxy) / 2;
    center.z = (bbox.minz + bbox.maxz) / 2;

    // Store center for later use
    this.pointCloudCenter = center;

    const size = Math.max(
      bbox.maxx - bbox.minx,
      bbox.maxy - bbox.miny,
      bbox.maxz - bbox.minz
    );

    // Set initial camera position based on control mode
    if (this.controlMode === 'fps') {
      // FPS: Start at corner looking across terrain
      const edgeX = bbox.minx + (size * 0.15);  // 15% from X edge
      const edgeZ = bbox.minz + (size * 0.15);  // 15% from Z edge
      const height = bbox.miny + 100;            // 100 units above minimum elevation

      this.camera.position.set(edgeX, height, edgeZ);

      // Calculate look direction toward opposite corner
      const targetX = bbox.maxx - (size * 0.15);
      const targetZ = bbox.maxz - (size * 0.15);
      const lookTarget = new THREE.Vector3(targetX, height, targetZ);

      this.camera.lookAt(lookTarget);
    } else {
      // Orbit: Start with aerial view
      const distance = size * 1.5;
      this.camera.position.set(
        center.x,
        center.y + distance * 0.7,
        center.z + distance * 0.7
      );

      this.orbitControls.target.copy(center);
      this.orbitControls.update();
    }
  }

  updateLoadingProgress(progress, fileNum, totalFiles, currentFile) {
    const progressElement = document.getElementById('loading-progress');
    const textElement = document.getElementById('loading-text');

    if (progressElement) {
      progressElement.textContent = `${Math.round(progress * 100)}%`;
    }

    if (textElement && fileNum && totalFiles) {
      if (currentFile === 'Merging...') {
        textElement.textContent = '✨ Weaving point clouds together...';
      } else if (currentFile === 'Complete') {
        textElement.textContent = '🎉 Ready to explore!';
      } else {
        // Delightful loading messages with Vancouver landmarks
        const messages = [
          '🌲 Mapping Stanley Park forests...',
          '🏙️ Rendering Downtown Vancouver...',
          '🎨 Loading Granville Island...',
          '🌉 Assembling Burrard Street Bridge...',
          '🌉 Building Cambie Street Bridge...',
          '⚽ Constructing BC Place...',
          '🔬 Mapping Science World terrain...',
          '🚇 Tracing SkyTrain routes...',
          '🏖️ Capturing Kitsilano beaches...',
          '🛍️ Detailing Granville Street...',
          '🌳 Painting Fairview landscapes...',
          '✨ Polishing Vancouver point clouds...'
        ];

        // Pick a message based on file number for variety
        const message = messages[(fileNum - 1) % messages.length];
        textElement.textContent = `${message} (${fileNum}/${totalFiles})`;
      }
    }
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.style.display = 'none', 500);
    }
  }

  showError(message) {
    const overlay = document.getElementById('loading-overlay');
    const textElement = document.getElementById('loading-text');
    if (overlay && textElement) {
      textElement.textContent = `Error: ${message}`;
      textElement.style.color = '#ff4444';
    }
  }

  showWarning(message) {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 165, 0, 0.9);
      color: white;
      padding: 10px 20px;
      border-radius: 0 0 8px 8px;
      z-index: 999;
      font-size: 14px;
    `;
    warning.textContent = `Warning: ${message}`;
    document.body.appendChild(warning);

    setTimeout(() => warning.remove(), 5000);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
      // Enter fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  isFullscreen() {
    return !!(document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement ||
              document.msFullscreenElement);
  }

  onFullscreenChange() {
    // Handle fullscreen change if needed
    this.onWindowResize();
  }

  updateMovement() {
    if (this.controlMode !== 'fps' || !this.fpsControls.isLocked || !this.fpsControls.enabled) {
      return;
    }

    const delta = this.clock.getDelta();
    const moveDistance = this.moveSpeed * delta;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    const right = new THREE.Vector3();
    right.crossVectors(direction, this.camera.up).normalize();

    // Forward/backward - follow full camera direction (including vertical)
    if (this.moveState.forward) {
      this.camera.position.addScaledVector(direction, moveDistance);
    }
    if (this.moveState.backward) {
      this.camera.position.addScaledVector(direction, -moveDistance);
    }

    // Left/right strafe - perpendicular to look direction
    if (this.moveState.left) {
      this.camera.position.addScaledVector(right, -moveDistance);
    }
    if (this.moveState.right) {
      this.camera.position.addScaledVector(right, moveDistance);
    }

    // Up/down - vertical movement
    if (this.moveState.up) {
      this.camera.position.y += moveDistance;
    }
    if (this.moveState.down) {
      this.camera.position.y -= moveDistance;
    }
  }

  setupOrbitCenterControl() {
    this.renderer.domElement.addEventListener('dblclick', (event) => {
      // Only work in orbit mode
      if (this.controlMode !== 'orbit') return;

      // Raycast to find point cloud intersection
      const intersection = this.raycastPointCloud(event);

      if (intersection) {
        this.setOrbitCenter(intersection.point);
        this.showOrbitCenterIndicator(intersection.point);
      }
    });
  }

  raycastPointCloud(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    // Intersect with point cloud
    const pointCloud = this.pointCloudViewer.pointCloud;
    if (!pointCloud) return null;

    const intersects = raycaster.intersectObject(pointCloud);
    return intersects.length > 0 ? intersects[0] : null;
  }

  setOrbitCenter(point) {
    this.orbitControls.target.copy(point);
    this.orbitControls.update();
    console.log('Orbit center set to:', point);
  }

  showOrbitCenterIndicator(point) {
    // Remove previous indicator if exists
    if (this.orbitCenterIndicator) {
      this.scene.remove(this.orbitCenterIndicator);
      this.orbitCenterIndicator.geometry.dispose();
      this.orbitCenterIndicator.material.dispose();
    }

    // Create small glowing sphere at orbit center
    const geometry = new THREE.SphereGeometry(5, 16, 16);  // 5 unit radius
    const material = new THREE.MeshBasicMaterial({
      color: 0xff6600,  // Orange/amber to match UI
      transparent: true,
      opacity: 0.8
    });

    this.orbitCenterIndicator = new THREE.Mesh(geometry, material);
    this.orbitCenterIndicator.position.copy(point);
    this.scene.add(this.orbitCenterIndicator);

    // Fade out and remove after 3 seconds
    const startTime = Date.now();
    const fadeOut = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        this.orbitCenterIndicator.material.opacity = 0.8 * (1 - elapsed / 3000);
        requestAnimationFrame(fadeOut);
      } else {
        this.scene.remove(this.orbitCenterIndicator);
        this.orbitCenterIndicator.geometry.dispose();
        this.orbitCenterIndicator.material.dispose();
        this.orbitCenterIndicator = null;
      }
    };
    fadeOut();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update movement for FPS controls
    if (this.controlMode === 'fps') {
      this.updateMovement();
    } else if (this.controlMode === 'orbit') {
      this.orbitControls.update();
    }

    this.pathAnimator.update();

    if (this.pointCloudViewer) {
      this.pointCloudViewer.update();
    }

    if (this.performanceMonitor) {
      this.performanceMonitor.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

class CameraPresets {
  constructor(visualizer) {
    this.visualizer = visualizer;
  }

  // Calculate preset positions based on point cloud bounds
  getPresets() {
    const bounds = this.visualizer.pointCloudBounds;
    const center = this.visualizer.pointCloudCenter;
    if (!bounds || !center) return null;

    const size = Math.max(
      bounds.maxx - bounds.minx,
      bounds.maxz - bounds.minz
    );
    const distance = size * 1.5;  // Distance multiplier for aerial views

    return {
      home: {
        position: {
          x: center.x,
          y: center.y + distance * 0.7,
          z: center.z + distance * 0.7
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'Default aerial view'
      },

      top: {
        position: {
          x: center.x,
          y: bounds.maxy + distance * 0.8,
          z: center.z
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'Top-down plan view'
      },

      ground: {
        position: {
          x: bounds.minx + (size * 0.15),
          y: bounds.miny + 100,
          z: bounds.minz + (size * 0.15)
        },
        rotation: this.calculateLookRotation(
          new THREE.Vector3(bounds.minx + size * 0.15, bounds.miny + 100, bounds.minz + size * 0.15),
          new THREE.Vector3(bounds.maxx - size * 0.15, bounds.miny + 100, bounds.maxz - size * 0.15)
        ),
        controlMode: 'fps',
        description: 'Ground-level corner view'
      },

      north: {
        position: {
          x: center.x,
          y: center.y,
          z: bounds.minz - distance * 0.5
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'View from south'
      },

      south: {
        position: {
          x: center.x,
          y: center.y,
          z: bounds.maxz + distance * 0.5
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'View from north'
      },

      east: {
        position: {
          x: bounds.maxx + distance * 0.5,
          y: center.y,
          z: center.z
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'View from east'
      },

      west: {
        position: {
          x: bounds.minx - distance * 0.5,
          y: center.y,
          z: center.z
        },
        target: center.clone(),
        controlMode: 'orbit',
        description: 'View from west'
      }
    };
  }

  calculateLookRotation(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    const euler = new THREE.Euler();
    euler.y = Math.atan2(direction.x, direction.z);
    euler.x = Math.asin(-direction.y);
    return { x: euler.x, y: euler.y, z: euler.z };
  }

  applyPreset(presetName) {
    const presets = this.getPresets();
    if (!presets || !presets[presetName]) {
      console.error('Preset not found:', presetName);
      return;
    }

    const preset = presets[presetName];

    // Switch control mode if needed
    if (this.visualizer.controlMode !== preset.controlMode) {
      this.visualizer.setControlMode(preset.controlMode);
    }

    // Apply camera position
    this.visualizer.camera.position.set(
      preset.position.x,
      preset.position.y,
      preset.position.z
    );

    // Apply rotation (for FPS) or target (for orbit)
    if (preset.controlMode === 'fps' && preset.rotation) {
      this.visualizer.camera.rotation.set(
        preset.rotation.x,
        preset.rotation.y,
        preset.rotation.z
      );
    } else if (preset.controlMode === 'orbit' && preset.target) {
      this.visualizer.orbitControls.target.copy(preset.target);
      this.visualizer.orbitControls.update();
    }
  }
}

new LiDARVisualizer();
