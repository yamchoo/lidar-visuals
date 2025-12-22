export class CameraPathManager {
  constructor() {
    this.paths = {};
    this.bounds = null;
    this.center = null;
  }

  // Initialize paths based on actual point cloud bounds
  initializePaths(bounds) {
    this.bounds = bounds;
    this.center = {
      x: (bounds.minx + bounds.maxx) / 2,
      y: (bounds.miny + bounds.maxy) / 2,
      z: (bounds.minz + bounds.maxz) / 2
    };

    // Calculate useful dimensions
    const sizeX = bounds.maxx - bounds.minx;
    const sizeZ = bounds.maxz - bounds.minz;
    const size = Math.max(sizeX, sizeZ);
    const groundLevel = bounds.miny + 100;  // Safe height above minimum elevation
    const lowAltitude = bounds.miny + 250;   // Low flying altitude
    const mediumAltitude = bounds.miny + 450; // Medium altitude for overview

    this.paths = {
      overview: {
        name: "City Overview",
        description: "Aerial view of the entire dataset",
        keyframes: [
          {
            position: { x: bounds.minx + sizeX * 0.2, y: mediumAltitude + 50, z: bounds.minz + sizeZ * 0.2 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 2000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: bounds.minx + sizeX * 0.1, y: mediumAltitude, z: bounds.minz + sizeZ * 0.1 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 4000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: bounds.maxx - sizeX * 0.1, y: mediumAltitude, z: bounds.maxz - sizeZ * 0.1 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 4000,
            easing: "Quadratic.InOut"
          }
        ]
      },
      flythrough: {
        name: "Low Flythrough",
        description: "Low-altitude path through the entire area",
        keyframes: [
          {
            position: { x: bounds.minx + sizeX * 0.1, y: lowAltitude, z: bounds.minz + sizeZ * 0.1 },
            target: { x: bounds.minx + sizeX * 0.4, y: groundLevel, z: bounds.minz + sizeZ * 0.4 },
            duration: 3000,
            easing: "Cubic.InOut"
          },
          {
            position: { x: this.center.x, y: lowAltitude + 20, z: this.center.z },
            target: { x: this.center.x + sizeX * 0.3, y: groundLevel, z: this.center.z + sizeZ * 0.3 },
            duration: 4000,
            easing: "Cubic.InOut"
          },
          {
            position: { x: bounds.maxx - sizeX * 0.1, y: lowAltitude, z: bounds.maxz - sizeZ * 0.1 },
            target: { x: bounds.maxx - sizeX * 0.4, y: groundLevel, z: bounds.maxz - sizeZ * 0.4 },
            duration: 3000,
            easing: "Cubic.InOut"
          }
        ]
      },
      inspection: {
        name: "Close Inspection",
        description: "Close-up views of terrain features",
        keyframes: [
          {
            position: { x: bounds.minx + sizeX * 0.25, y: lowAltitude - 20, z: bounds.minz + sizeZ * 0.25 },
            target: { x: bounds.minx + sizeX * 0.35, y: groundLevel, z: bounds.minz + sizeZ * 0.35 },
            duration: 3000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: this.center.x - sizeX * 0.1, y: lowAltitude - 10, z: this.center.z },
            target: { x: this.center.x + sizeX * 0.1, y: groundLevel, z: this.center.z + sizeZ * 0.1 },
            duration: 4000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: bounds.maxx - sizeX * 0.25, y: lowAltitude, z: bounds.maxz - sizeZ * 0.25 },
            target: { x: bounds.maxx - sizeX * 0.35, y: groundLevel, z: bounds.maxz - sizeZ * 0.35 },
            duration: 3000,
            easing: "Quadratic.InOut"
          }
        ]
      },
      rotate: {
        name: "360° Rotation",
        description: "Rotating view around the center",
        keyframes: [
          {
            position: { x: bounds.minx + sizeX * 0.2, y: mediumAltitude - 50, z: bounds.minz + sizeZ * 0.2 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 2000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: this.center.x - size * 0.55, y: mediumAltitude - 50, z: this.center.z },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 3000,
            easing: "Linear.None"
          },
          {
            position: { x: this.center.x - size * 0.35, y: mediumAltitude - 50, z: this.center.z + size * 0.35 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 3000,
            easing: "Linear.None"
          },
          {
            position: { x: this.center.x + size * 0.35, y: mediumAltitude - 50, z: this.center.z + size * 0.35 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 3000,
            easing: "Linear.None"
          },
          {
            position: { x: this.center.x + size * 0.55, y: mediumAltitude - 50, z: this.center.z },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 3000,
            easing: "Linear.None"
          },
          {
            position: { x: this.center.x + size * 0.35, y: mediumAltitude - 50, z: this.center.z - size * 0.35 },
            target: { x: this.center.x, y: groundLevel, z: this.center.z },
            duration: 3000,
            easing: "Linear.None"
          }
        ]
      },
      diagonal: {
        name: "Diagonal Sweep",
        description: "Sweeps diagonally across the full map",
        keyframes: [
          {
            position: { x: bounds.minx, y: mediumAltitude, z: bounds.minz },
            target: { x: bounds.minx + sizeX * 0.3, y: groundLevel, z: bounds.minz + sizeZ * 0.3 },
            duration: 2000,
            easing: "Quadratic.In"
          },
          {
            position: { x: this.center.x, y: mediumAltitude + 50, z: this.center.z },
            target: { x: this.center.x + sizeX * 0.2, y: groundLevel, z: this.center.z + sizeZ * 0.2 },
            duration: 4000,
            easing: "Quadratic.InOut"
          },
          {
            position: { x: bounds.maxx, y: mediumAltitude, z: bounds.maxz },
            target: { x: bounds.maxx - sizeX * 0.3, y: groundLevel, z: bounds.maxz - sizeZ * 0.3 },
            duration: 2000,
            easing: "Quadratic.Out"
          }
        ]
      }
    };
  }

  getPath(pathId) {
    return this.paths[pathId];
  }

  getAllPaths() {
    return this.paths;
  }

  getPathIds() {
    return Object.keys(this.paths);
  }

  getPathNames() {
    return this.getPathIds().map(id => ({
      id,
      name: this.paths[id].name,
      description: this.paths[id].description
    }));
  }

  pathExists(pathId) {
    return pathId in this.paths;
  }
}
