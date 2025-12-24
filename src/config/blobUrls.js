// Auto-generated - DO NOT edit manually
// Run 'npm run upload-blob' to regenerate

export const BLOB_URLS = {
  "bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz": "https://feb2d59b57167addcfadb94fdd80fbc7.r2.cloudflarestorage.com/lidar-visuals-data/bc_092g025_3_2_4_xyes_8_utm10_20170601_dsm.laz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=d0b511ed37656f18562322153372c621%2F20251224%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251224T011416Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=5771c2fa4736819cf2ddd8336f843b8f3b3519972801f89ccf6bdaeeb180c974",
  "bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz": "https://feb2d59b57167addcfadb94fdd80fbc7.r2.cloudflarestorage.com/lidar-visuals-data/bc_092g025_3_4_1_xyes_8_utm10_20170601_dsm.laz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=d0b511ed37656f18562322153372c621%2F20251224%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251224T011428Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=fff84599d904dd9720de75040bca8722a370631421724d29098e42285a7662bd",
  "bc_092g025_3_4_3_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_east.laz",
  "bc_092g025_3_4_3_middle.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_middle.laz",
  "bc_092g025_3_4_3_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_3_west.laz",
  "bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_092g025_3_4_4_xyes_8_utm10_20170601_dsm.laz",
  "bc_dsm_v12_east.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_east.laz",
  "bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz": "https://feb2d59b57167addcfadb94fdd80fbc7.r2.cloudflarestorage.com/lidar-visuals-data/bc_092g025_3_4_2_xyes_8_utm10_20170601_dsm.laz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=d0b511ed37656f18562322153372c621%2F20251224%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251224T011432Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=80ee376233478d52e236d7126eb1e34dcb7923ffa68d380c1104f0e849a5c997",
  "bc_dsm.copc.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm.copc.laz",
  "bc_dsm_v12_west.laz": "https://cwe18gmcraa7xjpc.public.blob.vercel-storage.com/bc_dsm_v12_west.laz",
  "bc_dsm_v12.laz": "https://feb2d59b57167addcfadb94fdd80fbc7.r2.cloudflarestorage.com/lidar-visuals-data/bc_dsm_v12.laz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=d0b511ed37656f18562322153372c621%2F20251223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251223T220152Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=41cee7958f8e0347d3a5d7fc33a30db648a0c10ba17e60ae99cb3e15eb61e2a6",
  "bc_092g025_3_4_3_xyes_8_utm10_20170601_dsm.laz": "https://feb2d59b57167addcfadb94fdd80fbc7.r2.cloudflarestorage.com/lidar-visuals-data/bc_092g025_3_4_3_xyes_8_utm10_20170601_dsm.laz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=d0b511ed37656f18562322153372c621%2F20251223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251223T220158Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=7dc3c62e39eaa3ece865ff907b0e73a1f0509a88b6226fef058512c378bfaf78"
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
