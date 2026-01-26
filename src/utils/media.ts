/**
 * 이미지 압축 및 최적화를 위한 유틸리티
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  type?: string;
}

export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    type = 'image/webp' // 용량 대비 화질이 뛰어난 webp 권장
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 비율 유지하며 최대 크기 제한
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not found'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          type,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
