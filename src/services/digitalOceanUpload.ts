import AWS from 'aws-sdk';

// Configure DigitalOcean Spaces (S3-compatible)
const spacesEndpoint = new AWS.Endpoint(import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: import.meta.env.VITE_DO_SPACES_ACCESS_KEY,
  secretAccessKey: import.meta.env.VITE_DO_SPACES_SECRET_KEY,
  region: 'fra1', // DigitalOcean Spaces region
  signatureVersion: 'v4'
});

export interface UploadOptions {
  productId: string;
  file: File;
  preserveOriginalName?: boolean;
}

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  error?: string;
}

/**
 * Upload image directly to DigitalOcean Spaces
 */
export async function uploadImageToSpaces(options: UploadOptions): Promise<UploadResult> {
  const { productId, file, preserveOriginalName = true } = options;

  // Validate environment variables
  const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
  const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;

  if (!accessKey || !secretKey ||
      accessKey === 'YOUR_ACCESS_KEY_HERE' ||
      secretKey === 'YOUR_SECRET_KEY_HERE') {
    throw new Error('DigitalOcean Spaces credentials not configured correctly. Please set real values for VITE_DO_SPACES_ACCESS_KEY and VITE_DO_SPACES_SECRET_KEY in .env.local (replace the placeholder values)');
  }

  try {
    // Generate file name - preserve original name or use numbered naming
    const folderName = productId.toUpperCase();
    const fileName = preserveOriginalName ? file.name : `${Date.now()}_${file.name}`;
    const key = `${folderName}/${fileName}`;

    console.log('🔄 Uploading to DigitalOcean Spaces:', key);

    // Convert File to Buffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload parameters
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery',
      Key: key,
      Body: new Uint8Array(fileBuffer),
      ACL: 'public-read', // Make file publicly accessible
      ContentType: file.type,
      CacheControl: 'max-age=31536000', // Cache for 1 year
      Metadata: {
        'original-name': file.name,
        'product-id': productId,
        'upload-date': new Date().toISOString()
      }
    };

    // Perform upload
    const result = await s3.upload(uploadParams).promise();

    console.log('✅ Upload successful:', result.Location);

    return {
      success: true,
      url: result.Location,
      key: result.Key
    };

  } catch (error) {
    console.error('❌ Upload failed:', error);

    let errorMessage = 'Upload failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      url: '',
      key: '',
      error: errorMessage
    };
  }
}

/**
 * Delete image from DigitalOcean Spaces
 */
export async function deleteImageFromSpaces(key: string): Promise<boolean> {
  try {
    const deleteParams: AWS.S3.DeleteObjectRequest = {
      Bucket: import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery',
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
    console.log('✅ Delete successful:', key);
    return true;

  } catch (error) {
    console.error('❌ Delete failed:', error);
    return false;
  }
}

/**
 * Check if DigitalOcean Spaces is properly configured
 */
export function isSpacesConfigured(): boolean {
  const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
  const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
  const bucket = import.meta.env.VITE_DO_SPACES_BUCKET;

  return !!(
    accessKey && secretKey && bucket &&
    accessKey !== 'YOUR_ACCESS_KEY_HERE' &&
    secretKey !== 'YOUR_SECRET_KEY_HERE'
  );
}

/**
 * Get Spaces configuration status for debugging
 */
export function getSpacesConfig() {
  return {
    endpoint: import.meta.env.VITE_DO_SPACES_ENDPOINT,
    bucket: import.meta.env.VITE_DO_SPACES_BUCKET,
    hasAccessKey: !!import.meta.env.VITE_DO_SPACES_ACCESS_KEY,
    hasSecretKey: !!import.meta.env.VITE_DO_SPACES_SECRET_KEY,
    isConfigured: isSpacesConfigured()
  };
}