import { Currency } from '../types/accounting';

export function formatCurrency(
  amount: number,
  currency: Currency = 'YER',
  exchangeRates?: Record<Currency, number>
): string {
  if (isNaN(amount)) return '0.00 ' + getCurrencySymbol(currency);
  
  let formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'YER' ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatted} ${getCurrencySymbol(currency)}`;
}

export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'YER':
      return 'ر.ي';
    case 'USD':
      return '$';
    case 'SAR':
      return 'ر.س';
    default:
      return currency;
  }
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: Record<Currency, number>
): number {
  if (from === to) return amount;
  // Convert from origin to Base (YER)
  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;
  const amountInBase = from === 'YER' ? amount : amount * rateFrom;
  return to === 'YER' ? amountInBase : amountInBase / rateTo;
}

// Arabic Tafqeet (Amount in words for Official Invoices and Vouchers)
export function tafqeetArabic(num: number, currency: Currency = 'YER'): string {
  if (num === 0) return 'صفر';
  
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let res = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    if (h > 0) {
      res += hundreds[h];
      if (remainder > 0) res += ' و';
    }
    if (remainder > 0) {
      if (remainder < 20) {
        res += ones[remainder];
      } else {
        const o = remainder % 10;
        const t = Math.floor(remainder / 10);
        if (o > 0) res += ones[o] + ' و';
        res += tens[t];
      }
    }
    return res;
  }

  const rounded = Math.floor(Math.abs(num));
  let parts: string[] = [];

  const billions = Math.floor(rounded / 1000000000);
  const millions = Math.floor((rounded % 1000000000) / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const units = rounded % 1000;

  if (billions > 0) parts.push(convertGroup(billions) + ' مليار');
  if (millions > 0) parts.push(convertGroup(millions) + ' مليون');
  if (thousands > 0) parts.push(convertGroup(thousands) + ' ألف');
  if (units > 0) parts.push(convertGroup(units));

  const words = parts.join(' و ');
  const curName = currency === 'YER' ? 'ريال يمني' : currency === 'SAR' ? 'ريال سعودي' : 'دولار أمريكي';
  return `فقط ${words} ${curName} لا غير.`;
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
