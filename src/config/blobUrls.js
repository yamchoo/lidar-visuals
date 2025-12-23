// Auto-generated - DO NOT edit manually
// Run 'npm run upload-blob' to regenerate

export const BLOB_URLS = {
  "bc_092g025_3_2_4_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_2_4_east.laz",
  "bc_092g025_3_2_4_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_2_4_west.laz",
  "bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz",
  "bc_092g025_3_4_1_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_1_east.laz",
  "bc_092g025_3_4_1_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_1_west.laz",
  "bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz",
  "bc_092g025_3_4_2_east.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_2_east.laz",
  "bc_092g025_3_4_2_west.laz": "https://rw.public.blob.vercel-storage.com/bc_092g025_3_4_2_west.laz",
  "bc_092g025_3_4_3_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_east.laz",
  "bc_092g025_3_4_3_middle.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_middle.laz",
  "bc_092g025_3_4_3_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_west.laz",
  "bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz",
  "bc_dsm_v12_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_east.laz",
  "bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz",
  "bc_dsm.copc.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm.copc.laz",
  "bc_dsm_v12_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_west.laz"
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
