# Deployment Guide

## Vercel Blob Storage Setup

This project uses Vercel Blob to host large LIDAR data files (1.2GB total), keeping them out of the Git repository while making them accessible to the deployed application.

### How It Works

1. **Local Development**: LIDAR files are stored in `public/data/` and served locally via Vite
2. **Production**: Files are uploaded to Vercel Blob and served via CDN

The `getDataUrl()` helper function in `src/config/blobUrls.js` automatically:
- Returns Blob URLs when available (production)
- Falls back to local paths for development

### Initial Setup (Already Done)

```bash
# Install dependencies
npm install @vercel/blob dotenv

# Add Blob token to .env.local
BLOB_READ_WRITE_TOKEN=your_token_here

# Upload files to Vercel Blob
npm run upload-blob
```

### Re-uploading Files

If you add or update LIDAR files:

```bash
npm run upload-blob
```

This will:
- Upload all `.laz` and `.ply` files from `public/data/`
- Generate `blob-urls.json` (ignored by Git)
- Update `src/config/blobUrls.js` with new URLs
- Commit the updated `blobUrls.js` file

### Deployment

```bash
# Build and deploy to Vercel
vercel --prod
```

The build process will use the Blob URLs from `src/config/blobUrls.js`, so your deployed app will fetch LIDAR data from Vercel's CDN.

### File Structure

- `public/data/*.laz` - Local LIDAR files (gitignored)
- `scripts/upload-to-blob.js` - Upload script
- `src/config/blobUrls.js` - Generated URL mappings (committed)
- `blob-urls.json` - Raw URL data (gitignored)
- `.env.local` - Blob token (gitignored)

### Cost

Vercel Blob pricing:
- First 500MB: Free
- Additional storage: $0.15/GB/month
- Your 1.2GB = ~$0.10/month beyond free tier
- No bandwidth charges
