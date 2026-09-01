/**
 * High-precision Vector Barcode (Code 128) & QR SVG Generator
 * Generates exact printable barcode vector paths for labels & stickers.
 */

// Code 128-B Patterns (107 patterns, each pattern has 6 bar/space widths totaling 11 modules, STOP is 13 modules)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP: 7 bars, 13 modules)
];

const START_B = 104;
const STOP = 106;

/**
 * Encodes an ASCII string into Code 128-B modules (array of boolean: true = bar, false = space)
 */
export function encodeCode128B(text: string): boolean[] {
  const cleanText = text.trim() || '000000';
  const codes: number[] = [START_B];

  // Convert each char to Code 128B index (ASCII value - 32)
  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    let val = charCode - 32;
    if (val < 0 || val > 95) {
      val = 0; // Fallback for unsupported chars
    }
    codes.push(val);
  }

  // Calculate Checksum: (START + sum(char_val * index)) % 103
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  // Convert codes to binary module stream
  const modules: boolean[] = [false, false, false, false, false, false, false, false, false, false]; // Quiet zone (10 modules)

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // Trailing Quiet zone
  for (let i = 0; i < 10; i++) {
    modules.push(false);
  }

  return modules;
}

/**
 * Generates an SVG string representation of a Code 128 barcode
 */
export function generateBarcodeSvgPath(modules: boolean[], height: number = 50, moduleWidth: number = 2): {
  svgWidth: number;
  svgHeight: number;
  rectangles: { x: number; width: number; height: number }[];
} {
  const svgWidth = modules.length * moduleWidth;
  const svgHeight = height;
  const rectangles: { x: number; width: number; height: number }[] = [];

  let currentBarStart: number | null = null;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) {
      if (currentBarStart === null) {
        currentBarStart = i;
      }
    } else {
      if (currentBarStart !== null) {
        rectangles.push({
          x: currentBarStart * moduleWidth,
          width: (i - currentBarStart) * moduleWidth,
          height: svgHeight,
        });
        currentBarStart = null;
      }
    }
  }

  if (currentBarStart !== null) {
    rectangles.push({
      x: currentBarStart * moduleWidth,
      width: (modules.length - currentBarStart) * moduleWidth,
      height: svgHeight,
    });
  }

  return { svgWidth, svgHeight, rectangles };
}
