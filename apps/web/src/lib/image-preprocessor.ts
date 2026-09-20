export interface ProcessedImage {
  cleanBase64: string;
  mimeType: string;
  sizeBytes: number;
}

export function preprocessImage(dataUrlOrBase64: string): ProcessedImage {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') {
    throw new Error('Invalid image payload: string required');
  }

  let mimeType = 'image/jpeg';
  let cleanBase64 = dataUrlOrBase64.trim();

  // Match data URL prefix if present
  const match = cleanBase64.match(/^data:(image\/(?:jpeg|png|webp|heic));base64,(.+)$/i);
  if (match) {
    mimeType = match[1].toLowerCase();
    cleanBase64 = match[2];
  } else if (cleanBase64.startsWith('data:')) {
    throw new Error('Unsupported image format. Allowed formats: JPEG, PNG, WEBP');
  }

  // Calculate approximate byte size from Base64 length
  const sizeBytes = Math.round((cleanBase64.length * 3) / 4);
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

  if (sizeBytes > maxSizeBytes) {
    throw new Error(`Image size (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB`);
  }

  if (sizeBytes < 100) {
    throw new Error('Uploaded image payload is corrupt or too small');
  }

  return {
    cleanBase64,
    mimeType,
    sizeBytes,
  };
}
