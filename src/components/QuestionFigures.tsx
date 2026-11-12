"use client";

import React, { useState } from "react";
import { Image as ImageIcon, ZoomIn, X } from "lucide-react";

interface QuestionFiguresProps {
  imageUrl?: string;
  imageUrls?: string[];
  questionNumber: number;
  variant?: "default" | "print" | "presentation";
  onRemoveImage?: (index: number) => void;
}

export function getQuestionImageList(imageUrl?: string, imageUrls?: string[]): string[] {
  if (imageUrls && imageUrls.length > 0) return imageUrls.filter(Boolean);
  if (imageUrl) return [imageUrl];
  return [];
}

export function QuestionFigures({
  imageUrl,
  imageUrls,
  questionNumber,
  variant = "default",
  onRemoveImage,
}: QuestionFiguresProps) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  const list = getQuestionImageList(imageUrl, imageUrls);
  if (list.length === 0) return null;

  if (variant === "print") {
    return (
      <div className="my-2 flex flex-wrap items-center justify-center gap-3">
        {list.map((url, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={idx}
            src={url}
            alt={`Hình vẽ câu ${questionNumber} (${idx + 1})`}
            className="max-h-52 max-w-sm object-contain border border-gray-200 rounded p-1 bg-white"
          />
        ))}
      </div>
    );
  }

  if (variant === "presentation") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {list.map((url, idx) => (
            <div
              key={idx}
              onClick={() => setZoomedUrl(url)}
              title="Bấm để phóng to toàn màn hình"
              className="relative group flex justify-center p-3 bg-white rounded-2xl shadow-inner max-w-lg cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Hình minh họa câu ${questionNumber} (${idx + 1})`}
                className="max-h-72 object-contain"
              />
              <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Phóng to</span>
              </span>
            </div>
          ))}
        </div>
        {zoomedUrl && (
          <div
            onClick={() => setZoomedUrl(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedUrl}
              alt="Phóng to hình vẽ"
              className="max-h-[92vh] max-w-[94vw] rounded-2xl bg-white p-4 object-contain shadow-2xl"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="p-2.5 rounded-xl bg-card border border-border/70 w-fit max-w-full space-y-2">
        <div className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>
            Hình vẽ câu hỏi {list.length > 1 ? `(${list.length} hình)` : ""} — bấm vào hình để phóng to:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {list.map((url, idx) => (
            <div key={idx} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Hình vẽ câu ${questionNumber} (${idx + 1})`}
                onClick={() => setZoomedUrl(url)}
                title="Bấm để phóng to hình vẽ"
                className="max-h-60 max-w-full rounded-lg object-contain bg-white border border-border/50 p-1 cursor-zoom-in hover:ring-2 hover:ring-blue-500/50 transition-all"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(idx);
                  }}
                  title="Xóa hình vẽ này"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {zoomedUrl && (
        <div
          onClick={() => setZoomedUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedUrl}
            alt="Phóng to hình vẽ"
            className="max-h-[90vh] max-w-[92vw] rounded-2xl bg-white p-3 object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
