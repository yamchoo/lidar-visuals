import { config } from 'dotenv';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFile, writeFile } from 'fs/promises';

// Load environment variables
config({ path: '.env.local' });

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME
} = process.env;

// Validate required environment variables
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('❌ Error: Missing R2 credentials in .env.local');
  console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
  process.exit(1);
}

// Configure S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

console.log('🔗 Connecting to Cloudflare R2...');
console.log(`📦 Bucket: ${R2_BUCKET_NAME}\n`);

async function listR2Files() {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
  });

  const response = await s3Client.send(command);
  return response.Contents || [];
}

async function generatePresignedUrl(key, expiresInDays = 7) {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  // Convert days to seconds (max 7 days for AWS S3/R2)
  const expiresIn = expiresInDays * 24 * 60 * 60;

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

async function getExistingUrls() {
  // Read existing blob-urls.json if it exists
  try {
    const content = await readFile('./blob-urls.json', 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('⚠️  No existing blob-urls.json found, will create new one');
    return {};
  }
}

async function regenerateUrls() {
  try {
    // List all files in R2 bucket
    console.log('📋 Listing files in R2 bucket...');
    const files = await listR2Files();

    if (files.length === 0) {
      console.log('⚠️  No files found in R2 bucket');
      return;
    }

    console.log(`✓ Found ${files.length} files\n`);

    // Get existing URLs to preserve Vercel Blob URLs
    const existingUrls = await getExistingUrls();
    const updatedUrls = {};

    // Keep existing Vercel Blob URLs (they don't expire)
    for (const [filename, url] of Object.entries(existingUrls)) {
      if (url.includes('vercel-storage.com')) {
        updatedUrls[filename] = url;
        console.log(`⏭️  Keeping Vercel Blob URL: ${filename}`);
      }
    }

    console.log('');

    // Generate new presigned URLs for R2 files (7-day expiration - AWS/R2 max)
    console.log('🔗 Generating R2 presigned URLs (7-day expiration)...\n');
    let updatedCount = 0;

    for (const file of files) {
      const filename = file.Key;

      // Skip non-LIDAR files
      if (!filename.endsWith('.laz') && !filename.endsWith('.ply')) {
        continue;
      }

      console.log(`  📄 ${filename}`);
      const url = await generatePresignedUrl(filename, 7);
      updatedUrls[filename] = url;
      updatedCount++;
      console.log(`     ✓ Generated URL (expires in 7 days)\n`);
    }

    console.log(`✅ Generated ${updatedCount} R2 presigned URLs\n`);

    // Save updated URLs
    await writeFile('./blob-urls.json', JSON.stringify(updatedUrls, null, 2));
    console.log('💾 Updated blob-urls.json');

    // Generate JS config file
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const configContent = `// Auto-generated - DO NOT edit manually
// Run 'npm run regenerate-r2-urls' weekly to keep URLs fresh
// R2 presigned URLs expire: ${expirationDate} (7-day max)

export const BLOB_URLS = ${JSON.stringify(updatedUrls, null, 2)};

// Helper function to get blob URL or fallback to local path (for dev)
export function getDataUrl(filename) {
  // In production, use Blob URL
  if (BLOB_URLS[filename]) {
    return BLOB_URLS[filename];
  }

  // In development, use local path
  return \`/data/\${filename}\`;
}
`;

    await writeFile('./src/config/blobUrls.js', configContent);
    console.log('💾 Updated src/config/blobUrls.js');

    console.log('\n✅ Done! All R2 presigned URLs have been regenerated.');
    console.log('⏰ R2 URLs will expire on:', expirationDate);
    console.log('📦 Total files in config:', Object.keys(updatedUrls).length);
    console.log('\n💡 Tip: Run this script again before expiration to keep URLs fresh.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.Code === 'NoSuchBucket') {
      console.error('   Bucket not found. Check your R2_BUCKET_NAME in .env.local');
    } else if (error.Code === 'InvalidAccessKeyId') {
      console.error('   Invalid credentials. Check your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
    }
    process.exit(1);
  }
}

regenerateUrls();
