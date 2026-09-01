/**
 * ZATCA / Standard Tax Authority TLV (Tag-Length-Value) Base64 QR Code Generator
 * Tags:
 * 1: Seller's Name (اسم المورّد / المنشأة)
 * 2: Seller's VAT Number (الرقم الضريبي للمنشأة)
 * 3: Invoice Timestamp (تاريخ ووقت الفاتورة بنظام ISO 8601)
 * 4: Invoice Total Amount with VAT (إجمالي الفاتورة شاملاً الضريبة)
 * 5: Total VAT Amount (مجموع ضريبة القيمة المضافة)
 * 6: Cryptographic Stamp / Hash (الختم الرقمي الاختياري)
 */

export function toUTF8Array(str: string): number[] {
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return utf8;
}

export function generateTLVBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalWithVat: number | string,
  totalVat: number | string,
  cryptoHash?: string
): string {
  const formattedTotal = typeof totalWithVat === 'number' ? totalWithVat.toFixed(2) : totalWithVat;
  const formattedVat = typeof totalVat === 'number' ? totalVat.toFixed(2) : totalVat;

  const tags = [
    { tag: 1, value: sellerName },
    { tag: 2, value: vatNumber },
    { tag: 3, value: timestamp },
    { tag: 4, value: formattedTotal },
    { tag: 5, value: formattedVat },
  ];

  if (cryptoHash) {
    tags.push({ tag: 6, value: cryptoHash });
  }

  const tlvBytes: number[] = [];

  for (const item of tags) {
    const valueBytes = toUTF8Array(item.value);
    tlvBytes.push(item.tag);
    tlvBytes.push(valueBytes.length);
    tlvBytes.push(...valueBytes);
  }

  // Convert bytes to Base64
  let binary = '';
  const len = tlvBytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(tlvBytes[i]);
  }
  return btoa(binary);
}

export function decodeTLVBase64(base64Str: string): {
  sellerName?: string;
  vatNumber?: string;
  timestamp?: string;
  totalWithVat?: string;
  totalVat?: string;
  cryptoHash?: string;
  isValid: boolean;
} {
  try {
    const binary = atob(base64Str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let i = 0;
    const result: any = { isValid: true };
    const decoder = new TextDecoder('utf-8');

    while (i < bytes.length) {
      const tag = bytes[i];
      const length = bytes[i + 1];
      if (tag === undefined || length === undefined || i + 2 + length > bytes.length) {
        break;
      }
      const valBytes = bytes.slice(i + 2, i + 2 + length);
      const valStr = decoder.decode(valBytes);

      switch (tag) {
        case 1:
          result.sellerName = valStr;
          break;
        case 2:
          result.vatNumber = valStr;
          break;
        case 3:
          result.timestamp = valStr;
          break;
        case 4:
          result.totalWithVat = valStr;
          break;
        case 5:
          result.totalVat = valStr;
          break;
        case 6:
          result.cryptoHash = valStr;
          break;
      }
      i += 2 + length;
    }

    return result;
  } catch (err) {
    return { isValid: false };
  }
}
