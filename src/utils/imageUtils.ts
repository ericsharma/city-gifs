import { CAMERA_FILTER } from '../constants/theme';

// Apply the camera ambient filter (blur + saturation) to a raw image blob via canvas.
// Used for immersive-mode frame captures so the captured frames match the on-screen look.
export async function applyProcessedFilter(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No 2d context'));
        return;
      }
      ctx.filter = CAMERA_FILTER;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (processed) => {
          if (processed) resolve(processed);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/jpeg',
        0.9,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}
