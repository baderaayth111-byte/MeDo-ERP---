import React, { useMemo } from 'react';
import { encodeCode128B, generateBarcodeSvgPath } from '../../utils/barcode';

interface BarcodeProps {
  value: string;
  displayValue?: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  displayValue,
  height = 42,
  moduleWidth = 1.6,
  showText = true,
  className = '',
}) => {
  const barcodeData = useMemo(() => {
    const modules = encodeCode128B(value || '000000');
    return generateBarcodeSvgPath(modules, height, moduleWidth);
  }, [value, height, moduleWidth]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={barcodeData.svgWidth}
        height={barcodeData.svgHeight}
        viewBox={`0 0 ${barcodeData.svgWidth} ${barcodeData.svgHeight}`}
        className="max-w-full h-auto"
      >
        <rect width={barcodeData.svgWidth} height={barcodeData.svgHeight} fill="#ffffff" />
        {barcodeData.rectangles.map((rect, idx) => (
          <rect
            key={idx}
            x={rect.x}
            y={0}
            width={rect.width}
            height={rect.height}
            fill="#0f172a"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-bold text-slate-800 tracking-wider mt-0.5">
          {displayValue || value}
        </span>
      )}
    </div>
  );
};
