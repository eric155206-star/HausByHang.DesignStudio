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
