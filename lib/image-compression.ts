/**
 * Client-side high-performance image downscaling & compression.
 * Converts large 5MB-15MB phone camera photos to crisp ~150KB-250KB JPEGs
 * before network upload. Makes uploads up to 50x faster on mobile 3G/4G connections.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  previewUrl: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.75
): Promise<File> {
  // If not an image (e.g. video), return original file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Proportional scale to maxDimension (e.g. 1280px)
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(file); // Fallback to original if canvas not supported
          return;
        }

        // Fill white background for transparent images
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Initial compression pass
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If still > 350KB, do a second gentle pass at 0.65 quality to guarantee lightweight payload
            if (blob.size > 350 * 1024) {
              canvas.toBlob(
                (secondBlob) => {
                  const finalBlob = secondBlob || blob;
                  const compressedFile = new File(
                    [finalBlob],
                    file.name.replace(/\.[^/.]+$/, '') + '.jpg',
                    {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    }
                  );
                  resolve(compressedFile);
                },
                'image/jpeg',
                0.65
              );
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image and return file along with compression statistics
 */
export async function compressImageWithStats(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  const compressed = await compressImage(file);
  const compressedSize = compressed.size;
  const savingsPercent = originalSize > compressedSize
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  const previewUrl = URL.createObjectURL(compressed);

  return {
    file: compressed,
    originalSize,
    compressedSize,
    savingsPercent,
    previewUrl,
  };
}

/**
 * Batch compress multiple files concurrently
 */
export async function compressFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)));
}
