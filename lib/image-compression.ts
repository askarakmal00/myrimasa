/**
 * Client-side high-performance image downscaling & compression.
 * Converts large 5MB-15MB phone camera photos to ~150KB-300KB JPEGs
 * with crisp HD resolution (max 1440px) before network upload.
 * Makes uploads up to 50x faster on mobile 3G/4G connections.
 */
export async function compressImage(file: File, maxDimension = 1440, quality = 0.8): Promise<File> {
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

        // Calculate proportional scale if dimensions exceed maxDimension
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

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original if canvas not supported
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // If compression didn't reduce size, keep original
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log(
              `⚡ Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB ➔ ${(compressedFile.size / 1024).toFixed(0)}KB`
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
 * Batch compress multiple files concurrently
 */
export async function compressFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f)));
}
