import * as TWEEN from '@tweenjs/tween.js';

export class PathAnimator {
  constructor(camera, visualizer, pathManager) {
    this.camera = camera;
    this.visualizer = visualizer;
    this.pathManager = pathManager;
    this.activeTweens = [];
    this.isPlaying = false;
    this.currentPath = null;
    this.onCompleteCallback = null;
    this.tweenGroup = new TWEEN.Group();
    this.previousControlMode = null;
  }

  playPath(pathId, onComplete) {
    this.stop();

    const path = this.pathManager.getPath(pathId);
    if (!path) {
      console.error(`Path "${pathId}" not found`);
      return;
    }

    console.log(`Starting camera path: ${pathId}`, path);
    console.log('Current camera position:', this.camera.position);

    // Store current control mode and switch to orbit (needed for target property)
    this.previousControlMode = this.visualizer.controlMode;
    if (this.previousControlMode === 'fps') {
      this.visualizer.setControlMode('orbit');
    }

    const controls = this.visualizer.orbitControls;
    console.log('Current camera target:', controls.target);

    this.currentPath = pathId;
    this.isPlaying = true;
    this.onCompleteCallback = onComplete;

    controls.enabled = false;

    this.createTweenChain(path.keyframes);
  }

  createTweenChain(keyframes) {
    if (!keyframes || keyframes.length === 0) return;

    const controls = this.visualizer.orbitControls;
    let previousTween = null;

    keyframes.forEach((keyframe, index) => {
      const startPos = index === 0 ? {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      } : keyframes[index - 1].position;

      const startTarget = index === 0 ? {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z
      } : keyframes[index - 1].target;

      const tween = new TWEEN.Tween({
        camX: startPos.x,
        camY: startPos.y,
        camZ: startPos.z,
        targetX: startTarget.x,
        targetY: startTarget.y,
        targetZ: startTarget.z
      }, this.tweenGroup)
        .to({
          camX: keyframe.position.x,
          camY: keyframe.position.y,
          camZ: keyframe.position.z,
          targetX: keyframe.target.x,
          targetY: keyframe.target.y,
          targetZ: keyframe.target.z
        }, keyframe.duration)
        .easing(this.getEasingFunction(keyframe.easing))
        .onStart(() => {
          console.log(`✓ Starting keyframe ${index}:`, keyframe.position);
        })
        .onUpdate((coords) => {
          this.camera.position.set(coords.camX, coords.camY, coords.camZ);
          controls.target.set(coords.targetX, coords.targetY, coords.targetZ);
        })
        .onComplete(() => {
          console.log(`✓ Completed keyframe ${index}`);
        });

      this.activeTweens.push(tween);

      if (previousTween) {
        console.log(`Chaining keyframe ${index} to previous`);
        previousTween.chain(tween);
      } else {
        console.log(`Starting first tween (keyframe ${index})`);
        const started = tween.start();
        console.log('Tween start returned:', started);
      }

      if (index === keyframes.length - 1) {
        tween.onComplete(() => {
          this.onPathComplete();
        });
      }

      previousTween = tween;
    });
  }

  getEasingFunction(easingString) {
    if (!easingString) return TWEEN.Easing.Quadratic.InOut;

    const parts = easingString.split('.');
    if (parts.length === 2) {
      const [type, direction] = parts;
      if (TWEEN.Easing[type] && TWEEN.Easing[type][direction]) {
        return TWEEN.Easing[type][direction];
      }
    }

    return TWEEN.Easing.Quadratic.InOut;
  }

  stop() {
    this.activeTweens.forEach(tween => tween.stop());
    this.activeTweens = [];
    this.isPlaying = false;
    this.currentPath = null;

    // Re-enable controls
    this.visualizer.orbitControls.enabled = true;

    // Restore previous control mode if we switched
    if (this.previousControlMode && this.previousControlMode !== this.visualizer.controlMode) {
      this.visualizer.setControlMode(this.previousControlMode);
    }
    this.previousControlMode = null;

    this.tweenGroup.removeAll();
  }

  pause() {
    this.activeTweens.forEach(tween => tween.pause());
    this.isPlaying = false;
  }

  resume() {
    this.activeTweens.forEach(tween => tween.resume());
    this.isPlaying = true;
  }

  onPathComplete() {
    this.isPlaying = false;

    // Re-enable controls
    this.visualizer.orbitControls.enabled = true;

    // Restore previous control mode if we switched
    if (this.previousControlMode && this.previousControlMode !== this.visualizer.controlMode) {
      this.visualizer.setControlMode(this.previousControlMode);
    }
    this.previousControlMode = null;

    if (this.onCompleteCallback) {
      this.onCompleteCallback(this.currentPath);
    }

    this.currentPath = null;
  }

  update() {
    // Update our tween group instead of the global TWEEN
    this.tweenGroup.update();
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      currentPath: this.currentPath
    };
  }
}
