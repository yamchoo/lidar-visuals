/**
 * MobileControls - Touch-optimized 3D navigation interface
 * Provides virtual joystick, gesture controls, and floating actions
 */

import * as THREE from 'three';

export class MobileControls {
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.container = null;
    this.joystick = null;
    this.joystickActive = false;
    this.joystickCenter = { x: 0, y: 0 };
    this.joystickOffset = { x: 0, y: 0 };
    this.touchStartPos = { x: 0, y: 0 };
    this.rotationActive = false;
    this.lastTouchDistance = 0;
    this.isControlsVisible = false;

    this.init();
  }

  init() {
    this.createControlsContainer();
    this.createFloatingActions();
    this.createVirtualJoystick();
    this.createGestureOverlay();
    this.setupEventListeners();
  }

  createControlsContainer() {
    this.container = document.createElement('div');
    this.container.className = 'mobile-controls';
    document.body.appendChild(this.container);
  }

  createFloatingActions() {
    const fabGroup = document.createElement('div');
    fabGroup.className = 'mobile-fab-group top-right';

    // Reset view button (quick action for returning to home view)
    const resetBtn = this.createButton('mobile-fab', 'reset-view', 'Reset View');
    resetBtn.appendChild(this.createSVG('reset'));
    fabGroup.appendChild(resetBtn);

    // Note: Toggle controls removed - use Settings button in nav bar instead

    this.container.appendChild(fabGroup);
  }

  createVirtualJoystick() {
    const joystickContainer = document.createElement('div');
    joystickContainer.className = 'virtual-joystick-container hidden';

    const joystick = document.createElement('div');
    joystick.className = 'virtual-joystick';

    const base = document.createElement('div');
    base.className = 'joystick-base';

    const ring = document.createElement('div');
    ring.className = 'joystick-ring';

    const center = document.createElement('div');
    center.className = 'joystick-center';

    const stick = document.createElement('div');
    stick.className = 'joystick-stick';

    base.appendChild(ring);
    base.appendChild(center);
    joystick.appendChild(base);
    joystick.appendChild(stick);

    const hint = document.createElement('div');
    hint.className = 'joystick-hint';
    const hintText = document.createElement('span');
    hintText.textContent = 'Drag to move camera';
    hint.appendChild(hintText);

    joystickContainer.appendChild(joystick);
    joystickContainer.appendChild(hint);

    this.container.appendChild(joystickContainer);
    this.joystick = joystickContainer;
  }

  createButton(className, action, title) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.dataset.action = action;
    btn.title = title;
    return btn;
  }

  createSVG(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');

    switch (type) {
      case 'reset':
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M10 2L15 7L12 7L12 13L8 13L8 7L5 7L10 2Z');
        path1.setAttribute('fill', 'currentColor');
        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M4 16L16 16');
        path2.setAttribute('stroke', 'currentColor');
        path2.setAttribute('stroke-width', '2');
        path2.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path1);
        svg.appendChild(path2);
        break;
      case 'menu':
        for (let i = 0; i < 3; i++) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '10');
          circle.setAttribute('cy', String(5 + i * 5));
          circle.setAttribute('r', '1.5');
          circle.setAttribute('fill', 'currentColor');
          svg.appendChild(circle);
        }
        break;
    }

    return svg;
  }

  createGestureOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'gesture-overlay hidden';

    const hint = document.createElement('div');
    hint.className = 'gesture-hint';

    const icon = document.createElement('div');
    icon.className = 'gesture-icon';
    icon.appendChild(this.createGestureSVG());

    const title = document.createElement('h3');
    title.textContent = 'Touch Controls';

    const list = document.createElement('ul');
    const instructions = [
      { label: 'One finger drag:', desc: 'Rotate view' },
      { label: 'Two finger pinch:', desc: 'Zoom in/out' },
      { label: 'Two finger drag:', desc: 'Pan camera' },
      { label: 'Joystick:', desc: 'Fly through space' }
    ];

    instructions.forEach(inst => {
      const li = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = inst.label;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(' ' + inst.desc));
      list.appendChild(li);
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'gesture-dismiss';
    dismissBtn.textContent = 'Got it';

    hint.appendChild(icon);
    hint.appendChild(title);
    hint.appendChild(list);
    hint.appendChild(dismissBtn);
    overlay.appendChild(hint);

    this.container.appendChild(overlay);

    // Show on first visit
    if (!localStorage.getItem('gestures-seen')) {
      setTimeout(() => {
        overlay.classList.remove('hidden');
        localStorage.setItem('gestures-seen', 'true');
      }, 1000);
    }

    // Dismiss button
    dismissBtn.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  }

  createGestureSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '60');
    svg.setAttribute('height', '60');
    svg.setAttribute('viewBox', '0 0 60 60');
    svg.setAttribute('fill', 'none');

    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle1.setAttribute('cx', '20');
    circle1.setAttribute('cy', '30');
    circle1.setAttribute('r', '8');
    circle1.setAttribute('stroke', 'currentColor');
    circle1.setAttribute('stroke-width', '2');

    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle2.setAttribute('cx', '40');
    circle2.setAttribute('cy', '30');
    circle2.setAttribute('r', '8');
    circle2.setAttribute('stroke', 'currentColor');
    circle2.setAttribute('stroke-width', '2');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', 'M15 30L45 30');
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '4 4');

    svg.appendChild(circle1);
    svg.appendChild(circle2);
    svg.appendChild(line);

    return svg;
  }

  createBottomNavBar() {
    const navBar = document.createElement('div');
    navBar.className = 'mobile-nav-bar';

    const navItems = [
      { action: 'color-mode', label: 'Colors', icon: 'palette' },
      { action: 'viewpoints', label: 'Views', icon: 'viewpoint' },
      { action: 'toggle-joystick', label: 'Navigate', icon: 'joystick', primary: true },
      { action: 'paths', label: 'Paths', icon: 'path' },
      { action: 'settings', label: 'Settings', icon: 'settings' }
    ];

    navItems.forEach(item => {
      const btn = document.createElement('button');
      btn.className = item.primary ? 'mobile-nav-btn mobile-nav-btn-primary' : 'mobile-nav-btn';
      btn.dataset.action = item.action;

      btn.appendChild(this.createNavIcon(item.icon));

      const span = document.createElement('span');
      span.textContent = item.label;
      btn.appendChild(span);

      navBar.appendChild(btn);
    });

    this.container.appendChild(navBar);
  }

  createNavIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');

    // Create different icons based on type
    // (simplified for brevity - add full implementations as needed)
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    circle.setAttribute('stroke', 'currentColor');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);

    return svg;
  }

  setupEventListeners() {
    // Call createBottomNavBar here since we need event listeners
    this.createBottomNavBar();

    // FAB actions
    this.container.querySelectorAll('.mobile-fab').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleFabAction(e));
    });

    // Nav bar actions
    this.container.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleNavAction(e));
    });

    // Virtual joystick
    const joystickStick = this.joystick.querySelector('.joystick-stick');
    joystickStick.addEventListener('touchstart', this.onJoystickStart.bind(this));
    joystickStick.addEventListener('touchmove', this.onJoystickMove.bind(this));
    joystickStick.addEventListener('touchend', this.onJoystickEnd.bind(this));

    // Canvas gesture controls
    const canvas = this.visualizer.renderer?.domElement;
    if (canvas) {
      console.log('Attaching touch listeners to canvas');
      canvas.addEventListener('touchstart', this.onCanvasTouchStart.bind(this), { passive: false });
      canvas.addEventListener('touchmove', this.onCanvasTouchMove.bind(this), { passive: false });
      canvas.addEventListener('touchend', this.onCanvasTouchEnd.bind(this), { passive: false });
    } else {
      console.error('Canvas not found for mobile touch controls');
    }
  }

  handleFabAction(e) {
    const action = e.currentTarget.dataset.action;

    switch (action) {
      case 'reset-view':
        this.resetView();
        this.showFeedback('View Reset');
        break;
      case 'toggle-controls':
        this.toggleControlPanel();
        break;
    }
  }

  handleNavAction(e) {
    const action = e.currentTarget.dataset.action;

    // Add active state
    this.container.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    switch (action) {
      case 'toggle-joystick':
        this.toggleJoystick();
        break;
      case 'color-mode':
        this.showColorModeMenu();
        break;
      case 'viewpoints':
        this.showViewpointsMenu();
        break;
      case 'paths':
        this.showPathsMenu();
        break;
      case 'settings':
        this.toggleControlPanel();
        break;
    }
  }

  toggleJoystick() {
    this.isControlsVisible = !this.isControlsVisible;
    if (this.isControlsVisible) {
      this.joystick.classList.remove('hidden');
      this.showFeedback('Joystick Active');
    } else {
      this.joystick.classList.add('hidden');
    }
  }

  toggleControlPanel() {
    const panel = document.querySelector('.control-panel');
    if (panel) {
      panel.classList.toggle('expanded');
    }
  }

  showColorModeMenu() {
    this.showQuickMenu('Color Modes', [
      { label: 'Elevation', action: () => this.visualizer.pointCloudViewer?.setColorMode('elevation') },
      { label: 'Vaporwave', action: () => this.visualizer.pointCloudViewer?.setColorMode('vaporwave') },
      { label: 'Intensity', action: () => this.visualizer.pointCloudViewer?.setColorMode('intensity') },
      { label: 'RGB', action: () => this.visualizer.pointCloudViewer?.setColorMode('rgb') }
    ]);
  }

  showViewpointsMenu() {
    this.showQuickMenu('Viewpoints', [
      { label: 'Home', action: () => this.visualizer.setViewpoint('home') },
      { label: 'Top View', action: () => this.visualizer.setViewpoint('top') },
      { label: 'North', action: () => this.visualizer.setViewpoint('north') },
      { label: 'South', action: () => this.visualizer.setViewpoint('south') },
      { label: 'East', action: () => this.visualizer.setViewpoint('east') },
      { label: 'West', action: () => this.visualizer.setViewpoint('west') }
    ]);
  }

  showPathsMenu() {
    const pathsObject = this.visualizer.pathManager?.getAllPaths() || {};
    const paths = Object.values(pathsObject);

    if (paths.length === 0) {
      this.showFeedback('No camera paths available');
      return;
    }

    const items = paths.map(path => ({
      label: path.name,
      action: () => {
        // Play the path immediately when selected
        this.visualizer.pathAnimator?.playPath(path.id);
        this.showFeedback(`Playing: ${path.name}`);
      }
    }));

    this.showQuickMenu('Camera Paths', items);
  }

  showQuickMenu(title, items) {
    // Remove existing menu
    const existing = document.querySelector('.mobile-quick-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'mobile-quick-menu';

    const content = document.createElement('div');
    content.className = 'quick-menu-content';

    const header = document.createElement('div');
    header.className = 'quick-menu-header';

    const h3 = document.createElement('h3');
    h3.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'quick-menu-close';
    closeBtn.textContent = '✕';

    header.appendChild(h3);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'quick-menu-body';

    items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.className = 'quick-menu-item';
      btn.dataset.index = String(i);
      btn.textContent = item.label;
      body.appendChild(btn);
    });

    content.appendChild(header);
    content.appendChild(body);
    menu.appendChild(content);

    document.body.appendChild(menu);

    // Show with animation
    setTimeout(() => menu.classList.add('visible'), 10);

    // Close button
    closeBtn.addEventListener('click', () => {
      menu.classList.remove('visible');
      setTimeout(() => menu.remove(), 300);
    });

    // Menu items
    menu.querySelectorAll('.quick-menu-item').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        items[i].action();
        menu.classList.remove('visible');
        setTimeout(() => menu.remove(), 300);
        this.showFeedback(items[i].label);
      });
    });

    // Close on backdrop click
    menu.addEventListener('click', (e) => {
      if (e.target === menu) {
        menu.classList.remove('visible');
        setTimeout(() => menu.remove(), 300);
      }
    });
  }

  showFeedback(message) {
    const existing = document.querySelector('.mobile-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.className = 'mobile-feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.classList.add('visible'), 10);
    setTimeout(() => {
      feedback.classList.remove('visible');
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }

  // Virtual Joystick Handlers
  onJoystickStart(e) {
    e.preventDefault();
    this.joystickActive = true;
    const stick = e.currentTarget;
    const base = stick.parentElement;
    const rect = base.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  onJoystickMove(e) {
    if (!this.joystickActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const dx = touch.clientX - this.joystickCenter.x;
    const dy = touch.clientY - this.joystickCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 50;

    // Clamp to circle
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * clampedDistance;
    const clampedY = Math.sin(angle) * clampedDistance;

    // Update stick position
    const stick = e.currentTarget;
    stick.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    // Normalize to -1 to 1
    this.joystickOffset = {
      x: clampedX / maxDistance,
      y: clampedY / maxDistance
    };

    // Apply to camera movement
    this.updateCameraFromJoystick();
  }

  onJoystickEnd(e) {
    e.preventDefault();
    this.joystickActive = false;
    const stick = e.currentTarget;
    stick.style.transform = 'translate(0, 0)';
    this.joystickOffset = { x: 0, y: 0 };
  }

  updateCameraFromJoystick() {
    if (!this.visualizer.camera || !this.visualizer.controls) return;

    const speed = 5;
    const camera = this.visualizer.camera;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    // Move forward/back based on Y axis
    forward.multiplyScalar(-this.joystickOffset.y * speed);
    // Move left/right based on X axis
    right.multiplyScalar(this.joystickOffset.x * speed);

    camera.position.add(forward);
    camera.position.add(right);

    // Update orbit controls target
    if (this.visualizer.controls.target) {
      this.visualizer.controls.target.copy(camera.position);
    }
  }

  // Canvas Touch Handlers
  onCanvasTouchStart(e) {
    // Don't capture touches that start on UI elements
    const target = e.target;
    if (target && target.closest && target.closest('.mobile-controls, .control-panel, button, .quick-menu')) {
      return;
    }

    if (e.touches.length === 1) {
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  onCanvasTouchMove(e) {
    // Don't capture touches on UI elements
    const target = e.target;
    if (target && target.closest && target.closest('.mobile-controls, .control-panel, button, .quick-menu')) {
      return;
    }

    if (e.touches.length === 1) {
      // One finger drag - rotate camera (look around)
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.touchStartPos.x;
      const deltaY = touch.clientY - this.touchStartPos.y;

      const rotationSpeed = 0.005;

      if (this.visualizer.camera) {
        const camera = this.visualizer.camera;

        // FPS-style mouse look: yaw (horizontal) + pitch (vertical) rotation
        // Matches desktop FPS mode behavior with PointerLockControls

        // Horizontal rotation (yaw) - rotate around world Y axis
        const yawQuaternion = new THREE.Quaternion();
        yawQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * rotationSpeed);
        camera.quaternion.multiply(yawQuaternion);

        // Vertical rotation (pitch) - rotate around camera's local X axis
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const pitchQuaternion = new THREE.Quaternion();
        pitchQuaternion.setFromAxisAngle(right, -deltaY * rotationSpeed);
        camera.quaternion.multiply(pitchQuaternion);

        // Normalize to prevent drift
        camera.quaternion.normalize();
      }

      this.touchStartPos = {
        x: touch.clientX,
        y: touch.clientY
      };

    } else if (e.touches.length === 2) {
      e.preventDefault();

      // Pinch to move camera forward/backward
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.lastTouchDistance > 0) {
        const delta = distance - this.lastTouchDistance;
        const moveSpeed = 2.0; // Increased for more responsiveness

        if (this.visualizer.camera) {
          const camera = this.visualizer.camera;
          // Pinch in = move backward, pinch out = move forward
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          forward.multiplyScalar(delta * moveSpeed); // Removed negative: pinch out (positive) = forward, pinch in (negative) = backward
          camera.position.add(forward);
        }
      }

      this.lastTouchDistance = distance;
    }
  }

  onCanvasTouchEnd(e) {
    if (e.touches.length < 2) {
      this.lastTouchDistance = 0;
    }
  }

  resetView() {
    this.visualizer.setViewpoint('home');
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
  }
}
