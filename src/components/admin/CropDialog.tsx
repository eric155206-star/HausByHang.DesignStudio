"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/Button";
import type { PixelArea } from "@/lib/admin/resize";
import type { SiteImageCrop } from "@/lib/site-images";

/**
 * 裁切視窗：依序框出每個版本（例如電腦版、手機版）要顯示的範圍。
 * 拖曳移動、滑桿或滾輪縮放；裁切框比例鎖定成前台顯示的比例。
 * 只回傳「框了哪裡」，實際裁圖與上傳交給呼叫的元件。
 */
export function CropDialog({
  src,
  title,
  crops,
  onCancel,
  onConfirm,
}: {
  src: string;
  title: string;
  crops: SiteImageCrop[];
  onCancel: () => void;
  onConfirm: (areas: Record<SiteImageCrop["key"], PixelArea | undefined>) => void;
}) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState<Area | null>(null);
  const [areas, setAreas] = useState<Partial<Record<SiteImageCrop["key"], PixelArea>>>({});

  const crop = crops[step];
  const last = step === crops.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onCancel]);

  function next() {
    if (!current) return;
    const all = { ...areas, [crop.key]: current };
    if (last) {
      onConfirm({ desktop: all.desktop, mobile: all.mobile });
      return;
    }
    setAreas(all);
    setStep(step + 1);
    setPosition({ x: 0, y: 0 });
    setZoom(1);
    setCurrent(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`裁切${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-4 overflow-auto bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg">
            裁切{title}
            {crops.length > 1 && (
              <span className="ml-2 text-sm text-ink-3">
                {step + 1} / {crops.length}　{crop.label}
              </span>
            )}
          </h2>
          <p className="text-xs leading-[1.7] text-ink-3">
            拖曳照片調整位置，用下方滑桿或滑鼠滾輪縮放。框內就是網站上會顯示的範圍。
          </p>
        </div>

        <div className="relative h-[min(60vh,480px)] bg-ink">
          <Cropper
            key={crop.key}
            image={src}
            crop={position}
            zoom={zoom}
            aspect={crop.ratio}
            minZoom={1}
            maxZoom={4}
            showGrid
            onCropChange={setPosition}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCurrent(pixels)}
          />
        </div>

        <label className="flex items-center gap-3 text-xs text-ink-3">
          縮放
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-black"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            取消
          </Button>
          {step > 0 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setStep(step - 1);
                setPosition({ x: 0, y: 0 });
                setZoom(1);
                setCurrent(null);
              }}
            >
              上一步
            </Button>
          )}
          <Button size="sm" disabled={!current} onClick={next}>
            {last ? "確定並上傳" : `下一步：${crops[step + 1].label}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
