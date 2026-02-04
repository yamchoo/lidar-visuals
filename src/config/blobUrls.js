// Storage URLs for LIDAR data files
// Vercel Blob URLs (permanent) + Cloudflare R2 public URLs (permanent)
// R2 public bucket: https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev

export const BLOB_URLS = {
  // Vercel Blob storage (permanent)
  "bc_092g025_3_2_4_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_2_4_east.laz",
  "bc_092g025_3_2_4_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_2_4_west.laz",
  "bc_092g025_3_4_1_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_1_east.laz",
  "bc_092g025_3_4_1_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_1_west.laz",
  "bc_092g025_3_4_2_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_2_east.laz",
  "bc_092g025_3_4_2_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_2_west.laz",
  "bc_092g025_3_4_3_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_east.laz",
  "bc_092g025_3_4_3_middle.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_middle.laz",
  "bc_092g025_3_4_3_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_west.laz",
  "bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz",
  "bc_dsm_v12_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_east.laz",
  "bc_dsm.copc.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm.copc.laz",
  "bc_dsm_v12_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_west.laz",

  // Cloudflare R2 public bucket (permanent - no expiration)
  "bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz",
  "bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz",
  "bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz",
  "bc_092g025_3_4_3_xyes_8_utm10_20170601_dsm.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/bc_092g025_3_4_3_xyes_8_utm10_20170601_dsm.laz",
  "bc_dsm_v12.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/bc_dsm_v12.laz",
  "nyc_brooklyn_bridge.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/nyc_brooklyn_bridge.laz",
  "nyc_central_park.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/nyc_central_park.laz",
  "nyc_downtown_brooklyn.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/nyc_downtown_brooklyn.laz",
  "nyc_lower_manhattan.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/nyc_lower_manhattan.laz",
  "nyc_midtown.laz": "https://pub-95c61a6298f64c6f8bea060616f14b04.r2.dev/nyc_midtown.laz"
};

// Helper function to get blob URL or fallback to local path (for dev)
export function getDataUrl(filename) {
  // In production, use Blob URL
  if (BLOB_URLS[filename]) {
    return BLOB_URLS[filename];
  }

  // In development, use local path
  return `/data/${filename}`;
}
