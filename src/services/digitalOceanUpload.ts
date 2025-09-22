import AWS from 'aws-sdk';

// Lazy initialization to avoid prototype errors in production
let s3Client: AWS.S3 | null = null;

const getS3Client = (): AWS.S3 => {
  if (!s3Client) {
    // Validate environment variables before creating client
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    const endpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com';
    const bucket = import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery';

    if (!accessKey || !secretKey || !endpoint || !bucket) {
      throw new Error('DigitalOcean Spaces configuration is incomplete');
    }

    try {
      const spacesEndpoint = new AWS.Endpoint(`https://${bucket}.${endpoint}`);
      
      s3Client = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: 'fra1',
        signatureVersion: 'v4',
        s3ForcePathStyle: false,
        s3BucketEndpoint: true,
        httpOptions: {
          timeout: 5000,
          connectTimeout: 3000
        }
      });
    } catch (error) {
      throw new Error(`Failed to initialize DigitalOcean Spaces client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return s3Client;
};

export interface UploadOptions {
  productId: string;
  file: File;
  preserveOriginalName?: boolean;
  customFileName?: string; // Custom filename to use instead of auto-generated
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
  const { productId, file, preserveOriginalName = true, customFileName } = options;

  try {
    // Validate environment variables
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    const bucket = import.meta.env.VITE_DO_SPACES_BUCKET;

    if (!accessKey || !secretKey || !bucket ||
        accessKey === 'YOUR_ACCESS_KEY_HERE' ||
        secretKey === 'YOUR_SECRET_KEY_HERE') {
      throw new Error('DigitalOcean Spaces credentials not configured correctly. Please set real values for VITE_DO_SPACES_ACCESS_KEY and VITE_DO_SPACES_SECRET_KEY in .env.local (replace the placeholder values)');
    }

    // Generate file name - use custom name, preserve original, or use numbered naming
    const folderName = productId.toUpperCase();
    const fileName = customFileName || (preserveOriginalName ? file.name : `${Date.now()}_${file.name}`);
    const key = `${folderName}/${fileName}`;

    if (import.meta.env.DEV) {
      console.log('🔄 Uploading to DigitalOcean Spaces:', key);
    }

    // Convert File to Buffer for upload
    const fileBuffer = await file.arrayBuffer();

    // Upload parameters
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: bucket,
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

    // Perform upload using lazy-initialized client
    const result = await getS3Client().upload(uploadParams).promise();

    if (import.meta.env.DEV) {
      console.log('✅ Upload successful:', result.Location);
    }

    return {
      success: true,
      url: result.Location,
      key: result.Key
    };

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Upload failed:', error);
    }

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

    await getS3Client().deleteObject(deleteParams).promise();
    if (import.meta.env.DEV) {
      console.log('✅ Delete successful:', key);
    }
    return true;

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Delete failed:', error);
    }
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