const CONVERTIBLE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/bmp",
  "image/gif",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export const convertToWebp = (file, quality = 0.85) =>
  new Promise((resolve, reject) => {
    if (!file || !CONVERTIBLE_TYPES.has(file.type) || file.type === "image/webp") {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            resolve(file);
            return;
          }
          const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
          resolve(new File([blob], newName, { type: "image/webp", lastModified: Date.now() }));
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for conversion."));
    };
    img.src = url;
  });
