"use client";

import { useMemo } from "react";
import { encodeQrMatrix } from "@/lib/qr-code";

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeSvg({ value, size = 200, className = "" }: QrCodeSvgProps) {
  const matrix = useMemo(() => encodeQrMatrix(value || "https://lophocso.edu.vn/play"), [value]);
  const n = matrix.length;
  const margin = 2;
  const viewBoxSize = n + margin * 2;

  const pathData = useMemo(() => {
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) {
          d += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    return d;
  }, [matrix, n]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      shapeRendering="crispEdges"
      className={`bg-white rounded-xl ${className}`}
      role="img"
      aria-label={`Mã QR: ${value}`}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill="#ffffff" rx={1.5} />
      <path d={pathData} fill="#0f172a" />
    </svg>
  );
}
