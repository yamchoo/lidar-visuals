export const cameraPaths = {
  overview: {
    name: "City Overview",
    description: "Aerial view of the entire dataset",
    keyframes: [
      {
        position: { x: 489400, y: 400, z: 5456800 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 2000,
        easing: "Quadratic.InOut"
      },
      {
        position: { x: 489200, y: 350, z: 5456600 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 4000,
        easing: "Quadratic.InOut"
      },
      {
        position: { x: 490600, y: 350, z: 5458200 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 4000,
        easing: "Quadratic.InOut"
      }
    ]
  },
  flythrough: {
    name: "Low Flythrough",
    description: "Low-altitude path through the area",
    keyframes: [
      {
        position: { x: 488900, y: 200, z: 5456400 },
        target: { x: 489700, y: 60, z: 5457200 },
        duration: 3000,
        easing: "Cubic.InOut"
      },
      {
        position: { x: 489500, y: 220, z: 5456900 },
        target: { x: 490300, y: 60, z: 5457700 },
        duration: 4000,
        easing: "Cubic.InOut"
      },
      {
        position: { x: 490200, y: 200, z: 5457400 },
        target: { x: 491000, y: 60, z: 5458200 },
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
        position: { x: 489300, y: 180, z: 5456800 },
        target: { x: 489700, y: 60, z: 5457200 },
        duration: 3000,
        easing: "Quadratic.InOut"
      },
      {
        position: { x: 489500, y: 190, z: 5457000 },
        target: { x: 489900, y: 60, z: 5457400 },
        duration: 4000,
        easing: "Quadratic.InOut"
      },
      {
        position: { x: 489800, y: 200, z: 5457200 },
        target: { x: 490200, y: 60, z: 5457600 },
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
        position: { x: 489400, y: 300, z: 5456800 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 2000,
        easing: "Quadratic.InOut"
      },
      {
        position: { x: 488900, y: 300, z: 5457400 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 3000,
        easing: "Linear.None"
      },
      {
        position: { x: 489400, y: 300, z: 5458000 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 3000,
        easing: "Linear.None"
      },
      {
        position: { x: 490600, y: 300, z: 5458000 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 3000,
        easing: "Linear.None"
      },
      {
        position: { x: 491100, y: 300, z: 5457400 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 3000,
        easing: "Linear.None"
      },
      {
        position: { x: 490600, y: 300, z: 5456800 },
        target: { x: 490000, y: 60, z: 5457400 },
        duration: 3000,
        easing: "Linear.None"
      }
    ]
  }
};
