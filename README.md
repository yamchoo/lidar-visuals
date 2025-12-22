# LiDAR Point Cloud Visualizer

A stunning web-based 3D visualizer for LiDAR point cloud data, built with Three.js and Potree-core.

## Features

- **Interactive 3D Navigation**: Smooth pan, zoom, and rotate controls
- **Multiple Color Modes**: Elevation, Intensity, RGB, and Classification
- **Camera Path System**: Predefined animated camera paths for cinematic views
- **High Performance**: Handles 22+ million points with adaptive LOD
- **Performance Monitor**: Real-time FPS tracking
- **Modern UI**: Clean, intuitive control panel

## Tech Stack

- **Three.js**: 3D rendering engine
- **Potree-core**: Point cloud rendering with octree LOD
- **Vite**: Fast build tool and dev server
- **Tween.js**: Smooth camera path animations
- **COPC Format**: Cloud-optimized point cloud for web streaming

## Getting Started

### Prerequisites

- Node.js 20.19+ (you have v25.1.0)
- PDAL (for LAZ to COPC conversion)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Data Conversion

Your LiDAR data has already been converted to COPC format:

```bash
pdal translate \
  input.laz \
  public/data/output.copc.laz \
  --writers.copc.forward=all
```

## Controls

### Mouse Controls
- **Left Click + Drag**: Rotate view
- **Right Click + Drag**: Pan view
- **Scroll Wheel**: Zoom in/out

### Keyboard Shortcuts
- **Escape**: Stop camera path animation

### UI Controls
- **Color Mode**: Switch between elevation, intensity, RGB, and classification
- **Point Size**: Adjust point size (0.5 - 3.0)
- **Camera Paths**: Select and play predefined camera animations
- **Performance**: Toggle FPS counter

## Camera Paths

Four predefined camera paths are available:

1. **City Overview**: High-altitude aerial view of the entire dataset
2. **Low Flythrough**: Low-altitude path through urban areas
3. **Close Inspection**: Detailed close-up views of terrain features
4. **360° Rotation**: Rotating view around the center point

## Project Structure

```
lidar-visuals/
├── public/
│   ├── data/
│   │   └── bc_dsm.copc.laz      # Point cloud data (22M points)
│   └── index.html
├── src/
│   ├── main.js                   # Application entry point
│   ├── viewer/
│   │   └── PointCloudViewer.js  # Potree integration
│   ├── animation/
│   │   ├── CameraPathManager.js # Path management
│   │   ├── PathAnimator.js      # Animation engine
│   │   └── camera-paths.js      # Path definitions
│   ├── ui/
│   │   ├── ControlPanel.js      # UI controls
│   │   └── styles.css           # Styling
│   └── utils/
│       └── PerformanceMonitor.js # FPS tracking
├── package.json
├── vite.config.js
└── README.md
```

## Dataset Info

- **Location**: British Columbia, Canada (UTM Zone 10N)
- **Points**: 22,103,397
- **Bounds**: ~1.8km x ~1.4km x ~156m
- **Attributes**: X, Y, Z, Intensity, Classification, RGB, and more

## Performance Optimization

- **Point Budget**: 2 million points (adjustable)
- **Adaptive Point Sizing**: Automatic scaling based on camera distance
- **Octree LOD**: Hierarchical level-of-detail system
- **Frustum Culling**: Only render visible portions
- **Logarithmic Depth Buffer**: Prevents z-fighting at large scales

## Browser Support

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

WebGL 2.0 required.

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

Drag and drop the `dist/` folder after running `npm run build`.

### GitHub Pages

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Troubleshooting

### Point cloud not loading
- Check browser console for errors
- Verify COPC file exists at `public/data/bc_dsm.copc.laz`
- Ensure dev server is running on port 3000

### Poor performance
- Reduce point budget in `PointCloudViewer.js` (line 13)
- Lower point size in UI controls
- Check GPU usage in browser DevTools
- Disable anti-aliasing in `main.js` (line 67)

### Camera path stuttering
- Increase keyframe duration in `camera-paths.js`
- Reduce point budget during animation
- Use smoother easing functions

## Future Enhancements

- [ ] Path recording system
- [ ] Distance measurement tool
- [ ] Elevation profile cross-sections
- [ ] Multi-dataset support
- [ ] Annotation system
- [ ] Screenshot/video export
- [ ] VR mode with WebXR

## License

MIT

## Credits

Built with:
- [Three.js](https://threejs.org/)
- [Potree](https://github.com/potree/potree)
- [Vite](https://vitejs.dev/)
- [Tween.js](https://github.com/tweenjs/tween.js/)
