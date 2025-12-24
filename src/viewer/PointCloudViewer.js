import * as THREE from 'three';
import { load } from '@loaders.gl/core';
import { LASLoader } from '@loaders.gl/las';

export class PointCloudViewer {
  constructor(scene, camera, renderer, skipSampling = 20) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.pointCloud = null;
    this.colorMode = 'elevation';
    this.bounds = null;
    this.skipSampling = skipSampling;  // Configurable sampling rate (default 20 = 5%)
  }

  async load(urlsOrUrl, onProgress) {
    const urls = Array.isArray(urlsOrUrl) ? urlsOrUrl : [urlsOrUrl];

    if (urls.length === 1) {
      // Single file: use existing logic (backward compatible)
      return this.loadSingle(urls[0], onProgress);
    } else {
      // Multiple files: use new merge logic
      return this.loadMultiple(urls, onProgress);
    }
  }

  async loadSingle(url, onProgress) {
    try {
      if (onProgress) onProgress(0);

      console.log('Loading point cloud from:', url);

      const data = await this.loadSingleFile(url, (percent) => {
        if (onProgress) onProgress(percent * 0.7);
      });

      console.log('Point cloud loaded:', data);

      if (onProgress) onProgress(0.7);

      const originalPositions = new Float32Array(data.attributes.POSITION.value);
      const positions = new Float32Array(originalPositions.length);

      // Swap Y and Z: LAZ uses Y=northing, Z=elevation
      // Three.js needs Y=elevation (up), Z=northing (depth)
      for (let i = 0; i < originalPositions.length; i += 3) {
        positions[i] = originalPositions[i];         // X stays the same (easting)
        positions[i + 1] = originalPositions[i + 2];  // Y = elevation (was Z)
        positions[i + 2] = originalPositions[i + 1];  // Z = northing (was Y)
      }

      const colors = new Float32Array(positions.length);

      // Compute bounds from remapped position data
      let minx = Infinity, miny = Infinity, minz = Infinity;
      let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;

      for (let i = 0; i < positions.length; i += 3) {
        minx = Math.min(minx, positions[i]);
        miny = Math.min(miny, positions[i + 1]);
        minz = Math.min(minz, positions[i + 2]);
        maxx = Math.max(maxx, positions[i]);
        maxy = Math.max(maxy, positions[i + 1]);
        maxz = Math.max(maxz, positions[i + 2]);
      }

      this.bounds = { minx, miny, minz, maxx, maxy, maxz };

      // Store swapped positions for color computation
      this.positions = positions;

      this.computeColors(data, colors);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      geometry.computeBoundingBox();

      const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        sizeAttenuation: true
      });

      this.pointCloud = new THREE.Points(geometry, material);
      this.scene.add(this.pointCloud);

      this.rawData = data;

      if (onProgress) onProgress(1.0);

      console.log('Point cloud added to scene');

      return this.bounds;
    } catch (error) {
      console.error('Error in PointCloudViewer.loadSingle:', error);
      throw error;
    }
  }

  async loadSingleFile(url, onProgress) {
    // Manual progress tracking since loaders.gl progress isn't reliable
    let progressInterval = null;
    let currentProgress = 0;

    if (onProgress) {
      onProgress(0); // Start at 0%

      // Simulate progress over time (will be overridden if real progress comes in)
      progressInterval = setInterval(() => {
        if (currentProgress < 0.85) {
          currentProgress += 0.05; // Increment by 5% every interval
          onProgress(currentProgress);
        }
      }, 500); // Update every 500ms
    }

    try {
      const data = await load(url, LASLoader, {
        las: {
          colorDepth: 16,
          fp64: false,
          skip: this.skipSampling  // Configurable sampling (mobile: 50 = 2%, desktop: 20 = 5%)
        },
        onProgress: (progress) => {
          if (onProgress && progress.percent) {
            currentProgress = progress.percent / 100;
            onProgress(currentProgress);
          }
        }
      });

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (onProgress) {
        onProgress(1.0); // Complete
      }

      return data;
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      throw error;
    }
  }

  async loadMultiple(urls, onProgress) {
    try {
      const loadedFiles = [];
      const errors = [];

      // Phase 1: Load all files sequentially
      for (let i = 0; i < urls.length; i++) {
        const fileProgress = (filePercent) => {
          const overall = (i / urls.length) + (filePercent / urls.length * 0.9);
          if (onProgress) onProgress(overall, i + 1, urls.length, urls[i]);
        };

        try {
          const data = await this.loadSingleFile(urls[i], fileProgress);
          loadedFiles.push({ url: urls[i], data });
        } catch (error) {
          errors.push({ url: urls[i], error });
          console.error(`Failed to load ${urls[i]}:`, error);
        }
      }

      // Require at least one successful load
      if (loadedFiles.length === 0) {
        throw new Error('All files failed to load');
      }

      if (onProgress) onProgress(0.9, urls.length, urls.length, 'Merging...');

      // Phase 2: Merge all loaded data
      const merged = this.mergePointCloudData(loadedFiles);

      // Phase 3: Create geometry and add to scene
      this.createPointCloudFromMerged(merged);

      if (onProgress) onProgress(1.0, urls.length, urls.length, 'Complete');

      console.log(`Point cloud created with ${merged.totalPoints} points from ${loadedFiles.length} files`);

      return {
        bounds: this.bounds,
        loaded: loadedFiles.length,
        failed: errors.length,
        errors
      };
    } catch (error) {
      console.error('Error in loadMultiple:', error);
      throw error;
    }
  }

  mergePointCloudData(loadedFiles) {
    // Step 1: Calculate total point count
    let totalPoints = 0;
    for (const file of loadedFiles) {
      totalPoints += file.data.attributes.POSITION.value.length / 3;
    }

    console.log(`Merging ${loadedFiles.length} files with ${totalPoints} total points`);

    // Step 2: Allocate merged arrays
    const mergedPositions = new Float32Array(totalPoints * 3);
    const mergedColors = new Float32Array(totalPoints * 3);

    // Step 3: Initialize bounds
    let minx = Infinity, miny = Infinity, minz = Infinity;
    let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;

    // Step 4: Process and merge each file
    let offset = 0;

    for (const file of loadedFiles) {
      const originalPositions = file.data.attributes.POSITION.value;
      const pointCount = originalPositions.length / 3;

      // Apply Y/Z coordinate swap for this file
      for (let i = 0; i < pointCount; i++) {
        const srcIdx = i * 3;
        const dstIdx = offset + srcIdx;

        const x = originalPositions[srcIdx];
        const y = originalPositions[srcIdx + 1];  // LAZ Y = northing
        const z = originalPositions[srcIdx + 2];  // LAZ Z = elevation

        // Store with Three.js convention: Y=up
        mergedPositions[dstIdx] = x;           // X = easting
        mergedPositions[dstIdx + 1] = z;       // Y = elevation (was Z)
        mergedPositions[dstIdx + 2] = y;       // Z = northing (was Y)

        // Update bounds with swapped coordinates
        minx = Math.min(minx, x);
        miny = Math.min(miny, z);  // elevation
        minz = Math.min(minz, y);  // northing
        maxx = Math.max(maxx, x);
        maxy = Math.max(maxy, z);
        maxz = Math.max(maxz, y);
      }

      offset += originalPositions.length;
    }

    this.bounds = { minx, miny, minz, maxx, maxy, maxz };

    // Step 5: Build merged intensity and RGB arrays
    const mergedIntensity = this.buildMergedIntensityArray(loadedFiles, totalPoints);
    const mergedRGB = this.buildMergedRGBArray(loadedFiles, totalPoints);

    return {
      positions: mergedPositions,
      colors: mergedColors,
      bounds: this.bounds,
      intensity: mergedIntensity,
      rgb: mergedRGB,
      totalPoints
    };
  }

  buildMergedIntensityArray(loadedFiles, totalPoints) {
    // Check if any file has intensity data
    const hasIntensity = loadedFiles.some(f => f.data.attributes.intensity);
    if (!hasIntensity) return null;

    const merged = new Uint16Array(totalPoints);
    let offset = 0;

    for (const file of loadedFiles) {
      const intensity = file.data.attributes.intensity?.value;
      const pointCount = file.data.attributes.POSITION.value.length / 3;

      if (intensity) {
        merged.set(intensity, offset);
      } else {
        // Fill with zeros for files without intensity
        merged.fill(0, offset, offset + pointCount);
      }

      offset += pointCount;
    }

    return merged;
  }

  buildMergedRGBArray(loadedFiles, totalPoints) {
    // Check if any file has RGB data
    const hasRGB = loadedFiles.some(f => f.data.attributes.COLOR_0);
    if (!hasRGB) {
      console.log('No RGB data found in any files');
      return null;
    }

    const merged = new Uint8Array(totalPoints * 3);
    let byteOffset = 0;  // Track byte offset, not point offset

    for (const file of loadedFiles) {
      const rgb = file.data.attributes.COLOR_0?.value;
      const pointCount = file.data.attributes.POSITION.value.length / 3;
      const byteCount = pointCount * 3;

      console.log(`RGB merge: pointCount=${pointCount}, byteCount=${byteCount}, byteOffset=${byteOffset}, rgbLength=${rgb?.length}, mergedLength=${merged.length}`);

      if (rgb && rgb.length === byteCount) {
        merged.set(rgb, byteOffset);
      } else if (rgb) {
        console.warn(`RGB size mismatch: expected ${byteCount}, got ${rgb.length}`);
        // Copy what we can
        const copyLength = Math.min(rgb.length, byteCount);
        merged.set(rgb.subarray(0, copyLength), byteOffset);
        // Fill remaining with white
        for (let i = copyLength; i < byteCount; i++) {
          merged[byteOffset + i] = 255;
        }
      } else {
        // Fill with white for files without RGB
        for (let i = 0; i < byteCount; i++) {
          merged[byteOffset + i] = 255;
        }
      }

      byteOffset += byteCount;
    }

    console.log(`RGB merge complete: final byteOffset=${byteOffset}, merged length=${merged.length}`);
    return merged;
  }

  createPointCloudFromMerged(merged) {
    // Store for color mode switching
    this.positions = merged.positions;
    this.mergedData = merged;

    // Compute initial colors based on current color mode
    this.computeColorsFromMerged(merged.colors);

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(merged.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(merged.colors, 3));
    geometry.computeBoundingBox();

    // Create material with performance optimizations
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      sizeAttenuation: true,
      // Performance optimizations
      alphaTest: 0.5,        // Discard transparent fragments early (reduces overdraw)
      transparent: false,     // We don't need transparency
      depthWrite: true,       // Proper depth sorting
      depthTest: true         // Enable depth testing for occlusion
    });

    this.pointCloud = new THREE.Points(geometry, material);
    this.pointCloud.frustumCulled = true;  // Enable frustum culling

    // Compute bounding sphere for better culling performance
    geometry.computeBoundingSphere();

    this.scene.add(this.pointCloud);
    this.material = material;  // Store reference for dynamic adjustments
  }

  computeColorsFromMerged(colors) {
    const positions = this.positions;
    const count = positions.length / 3;

    switch (this.colorMode) {
      case 'elevation':
        this.computeElevationColors(positions, colors, count);
        break;

      case 'vaporwave':
        this.computeVaporwaveColors(positions, colors, count);
        break;

      case 'intensity':
        this.computeMergedIntensityColors(colors, count);
        break;

      case 'rgb':
        this.computeMergedRGBColors(colors, count);
        break;

      default:
        this.computeElevationColors(positions, colors, count);
    }
  }

  computeMergedIntensityColors(colors, count) {
    if (!this.mergedData.intensity) {
      // Fallback to elevation if no intensity data
      this.computeElevationColors(this.positions, colors, count);
      return;
    }

    const intensity = this.mergedData.intensity;
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;

    for (let i = 0; i < count; i++) {
      minIntensity = Math.min(minIntensity, intensity[i]);
      maxIntensity = Math.max(maxIntensity, intensity[i]);
    }

    const range = maxIntensity - minIntensity;

    for (let i = 0; i < count; i++) {
      const normalized = (intensity[i] - minIntensity) / range;
      colors[i * 3] = normalized;
      colors[i * 3 + 1] = normalized;
      colors[i * 3 + 2] = normalized;
    }
  }

  computeMergedRGBColors(colors, count) {
    if (!this.mergedData.rgb) {
      // Fallback to elevation if no RGB data
      this.computeElevationColors(this.positions, colors, count);
      return;
    }

    const rgb = this.mergedData.rgb;

    for (let i = 0; i < count; i++) {
      colors[i * 3] = rgb[i * 3] / 255;
      colors[i * 3 + 1] = rgb[i * 3 + 1] / 255;
      colors[i * 3 + 2] = rgb[i * 3 + 2] / 255;
    }
  }

  computeColors(data, colors) {
    // Use swapped positions for elevation, original data for intensity/RGB
    const positions = this.positions || data.attributes.POSITION.value;
    const count = positions.length / 3;

    switch (this.colorMode) {
      case 'elevation':
        this.computeElevationColors(positions, colors, count);
        break;
      case 'vaporwave':
        this.computeVaporwaveColors(positions, colors, count);
        break;
      case 'intensity':
        if (data.attributes.intensity) {
          this.computeIntensityColors(data.attributes.intensity.value, colors, count);
        } else {
          this.computeElevationColors(positions, colors, count);
        }
        break;
      case 'rgb':
        if (data.attributes.COLOR_0) {
          this.computeRGBColors(data.attributes.COLOR_0.value, colors, count);
        } else {
          this.computeElevationColors(positions, colors, count);
        }
        break;
      default:
        this.computeElevationColors(positions, colors, count);
    }
  }

  computeElevationColors(positions, colors, count) {
    let minY = Infinity;
    let maxY = -Infinity;

    // Y now contains elevation (after coordinate swap)
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const range = maxY - minY;

    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const normalized = (y - minY) / range;

      const color = this.getRainbowColor(normalized);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  getRainbowColor(t) {
    const r = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 3 - 3)));
    const g = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 3 - 2)));
    const b = Math.max(0, Math.min(1, 1.5 - Math.abs(t * 3 - 1)));
    return { r, g, b };
  }

  computeVaporwaveColors(positions, colors, count) {
    let minY = Infinity;
    let maxY = -Infinity;

    // Y now contains elevation (after coordinate swap)
    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    const range = maxY - minY;

    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const normalized = (y - minY) / range;

      const color = this.getVaporwaveColor(normalized);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
  }

  getVaporwaveColor(t) {
    // Enhanced vaporwave/synthwave color gradient with more stops
    // 0.0: Dark navy purple (#1a0440)
    // 0.14: Purple (#4a148c)
    // 0.28: Magenta (#b31f66)
    // 0.42: Hot pink (#ff006e)
    // 0.56: Coral pink (#ff6b9d)
    // 0.70: Orange (#ff7b00)
    // 0.85: Yellow-orange (#ffaa00)
    // 1.0: Bright yellow (#ffdd00)

    let r, g, b;

    if (t < 0.14) {
      // Dark navy purple to purple
      const local = t / 0.14;
      r = 0.102 + (0.290 - 0.102) * local;
      g = 0.016 + (0.078 - 0.016) * local;
      b = 0.251 + (0.549 - 0.251) * local;
    } else if (t < 0.28) {
      // Purple to magenta
      const local = (t - 0.14) / 0.14;
      r = 0.290 + (0.702 - 0.290) * local;
      g = 0.078 + (0.122 - 0.078) * local;
      b = 0.549 + (0.400 - 0.549) * local;
    } else if (t < 0.42) {
      // Magenta to hot pink
      const local = (t - 0.28) / 0.14;
      r = 0.702 + (1.0 - 0.702) * local;
      g = 0.122 + (0.0 - 0.122) * local;
      b = 0.400 + (0.431 - 0.400) * local;
    } else if (t < 0.56) {
      // Hot pink to coral pink
      const local = (t - 0.42) / 0.14;
      r = 1.0;
      g = 0.0 + (0.420 - 0.0) * local;
      b = 0.431 + (0.616 - 0.431) * local;
    } else if (t < 0.70) {
      // Coral pink to orange
      const local = (t - 0.56) / 0.14;
      r = 1.0;
      g = 0.420 + (0.482 - 0.420) * local;
      b = 0.616 + (0.0 - 0.616) * local;
    } else if (t < 0.85) {
      // Orange to yellow-orange
      const local = (t - 0.70) / 0.15;
      r = 1.0;
      g = 0.482 + (0.667 - 0.482) * local;
      b = 0.0;
    } else {
      // Yellow-orange to bright yellow
      const local = (t - 0.85) / 0.15;
      r = 1.0;
      g = 0.667 + (0.867 - 0.667) * local;
      b = 0.0;
    }

    return { r, g, b };
  }

  computeIntensityColors(intensity, colors, count) {
    let minIntensity = Infinity;
    let maxIntensity = -Infinity;

    for (let i = 0; i < count; i++) {
      minIntensity = Math.min(minIntensity, intensity[i]);
      maxIntensity = Math.max(maxIntensity, intensity[i]);
    }

    const range = maxIntensity - minIntensity;

    for (let i = 0; i < count; i++) {
      const normalized = (intensity[i] - minIntensity) / range;
      colors[i * 3] = normalized;
      colors[i * 3 + 1] = normalized;
      colors[i * 3 + 2] = normalized;
    }
  }

  computeRGBColors(rgbData, colors, count) {
    for (let i = 0; i < count; i++) {
      colors[i * 3] = rgbData[i * 3] / 255;
      colors[i * 3 + 1] = rgbData[i * 3 + 1] / 255;
      colors[i * 3 + 2] = rgbData[i * 3 + 2] / 255;
    }
  }

  setColorMode(mode) {
    if (!this.pointCloud) return;

    this.colorMode = mode;
    const colors = this.pointCloud.geometry.attributes.color.array;

    if (this.mergedData) {
      // Multi-file mode: compute colors from merged data
      this.computeColorsFromMerged(colors);
    } else if (this.rawData) {
      // Single-file mode: existing logic
      const count = colors.length / 3;
      this.computeColors(this.rawData, colors);
    }

    this.pointCloud.geometry.attributes.color.needsUpdate = true;
  }

  setPointSize(size) {
    if (!this.pointCloud) return;
    this.pointCloud.material.size = size;
  }

  setPointBudget(budget) {
    console.log('Point budget not applicable with loaders.gl');
  }

  getPointCount() {
    if (!this.pointCloud) return 0;
    return this.pointCloud.geometry.attributes.position.count;
  }

  update() {
    // Dynamic LOD: Adjust point size based on camera height for performance
    if (this.material && this.bounds && this.camera) {
      const cameraHeight = this.camera.position.y;
      const terrainMin = this.bounds.miny;
      const terrainMax = this.bounds.maxy;
      const terrainHeight = terrainMax - terrainMin;

      // Calculate height above terrain (normalized 0-1+)
      const heightAboveTerrain = (cameraHeight - terrainMin) / terrainHeight;

      // Dynamic point size: smaller when close, larger when far
      // Close: 0.3-0.5, Medium: 0.5-1.0, Far: 1.0-2.0
      let pointSize;
      if (heightAboveTerrain < 0.5) {
        // Close to terrain: small points for detail
        pointSize = 0.3 + heightAboveTerrain * 0.4;  // 0.3 to 0.5
      } else if (heightAboveTerrain < 2.0) {
        // Medium distance: moderate points
        pointSize = 0.5 + (heightAboveTerrain - 0.5) * 0.33;  // 0.5 to 1.0
      } else {
        // Far from terrain: large points for performance
        pointSize = Math.min(2.0, 1.0 + (heightAboveTerrain - 2.0) * 0.2);  // 1.0 to 2.0
      }

      this.material.size = pointSize;
      this.material.needsUpdate = true;
    }
  }

  dispose() {
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.pointCloud.geometry.dispose();
      this.pointCloud.material.dispose();
      this.pointCloud = null;
    }
  }
}
