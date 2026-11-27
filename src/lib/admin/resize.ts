/**
 * 在瀏覽器裡把照片縮成長邊最多 3840px 的 JPEG，再上傳。
 * 手機或相機原檔常常 5–20 MB，縮完大約 1.5–3 MB。
 * 3840 是為了高解析度螢幕：作品頁主圖在電腦上寬 1152px，Retina 螢幕需要兩倍以上的像素，
 * 直幅照片長邊若只留 2400，寬度只剩 1600，放大後會糊。
 * 網站顯示時 next/image 還會依螢幕大小再縮一次，所以訪客不會真的下載到這麼大的檔。
 * createImageBitmap 會依照 EXIF 自動轉正直拍照片。
 */
export const MAX_EDGE = 3840;

/** 上傳時的 JPEG 品質。顯示前還會再轉檔一次，這裡壓太多的話兩次壓縮疊加，細節會掉。 */
export const UPLOAD_QUALITY = 0.92;

/** 要拿來裁切的原圖留大一點、壓縮輕一點：放大裁切時才有足夠像素，也避免壓兩次造成的畫質損失。 */
export const ORIGINAL_MAX_EDGE = 4800;

export async function resizeImage(
  file: File,
  { maxEdge = MAX_EDGE, quality = UPLOAD_QUALITY }: { maxEdge?: number; quality?: number } = {},
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
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

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
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

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", UPLOAD_QUALITY));
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
