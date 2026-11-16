/**
 * 在瀏覽器裡把照片縮成長邊最多 2400px 的 JPEG，再上傳。
 * 手機或相機原檔常常 5–20 MB，縮完通常只剩幾百 KB，上傳快、網站也快。
 * createImageBitmap 會依照 EXIF 自動轉正直拍照片。
 */
export const MAX_EDGE = 2400;

export async function resizeImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器不支援圖片處理");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("照片轉檔失敗");
  return { blob, width, height };
}

export type PixelArea = { x: number; y: number; width: number; height: number };

/** 從來源圖裁出指定範圍（單位是來源圖的像素），輸出 JPEG。 */
export async function cropImage(
  source: CanvasImageSource,
  area: PixelArea,
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, MAX_EDGE / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器不支援圖片處理");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, area.x, area.y, area.width, area.height, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("照片裁切失敗");
  return { blob, width, height };
}

/** 把圖片網址（本機暫存或 Storage 公開網址）載成可以畫到 canvas 的圖。 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("照片載入失敗"));
    img.src = src;
  });
}
