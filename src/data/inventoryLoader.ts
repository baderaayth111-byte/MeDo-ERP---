import { defaultRawInventoryCsv } from './rawCsvData';
import { defaultRawInventoryCsvPart2 } from './rawCsvData2';
import { defaultRawInventoryCsvPart3 } from './rawCsvData3';
import { parseInventoryCsv } from '../utils/csvParser';
import { InventoryItem } from '../types/accounting';

export function getLoadedInitialInventoryItems(): InventoryItem[] {
  // If the user wants a clean items list via URL parameter for client demos
  if (typeof window !== 'undefined' && (window.location.search.includes('clean_items=true') || window.location.search.includes('clean_demo=true'))) {
    return [];
  }

  const fullCsv = `${defaultRawInventoryCsv}\n${defaultRawInventoryCsvPart2}\n${defaultRawInventoryCsvPart3}`;
  return parseInventoryCsv(fullCsv, 'WH-01');
}
