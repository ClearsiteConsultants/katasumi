import { useState, useEffect } from 'react';
import { debugLog } from '../utils/debug-logger.js';

export interface TerminalSize {
  rows: number;
  columns: number;
  isTooSmall: boolean;
  isTooNarrow: boolean;
  availableRows: number;
  availableRowsForAppSelector: number;
}

const MIN_ROWS = 20;
const MIN_COLUMNS = 80;

// More accurate row counting:
// - Header: 3 rows (1 row border box with title + 1 row status line + 1 row marginBottom)
// - Footer: 3 rows (1 row marginTop + 2 rows border box with help text)
// - App padding: 2 rows (top + bottom padding=1 in App.tsx Box)
// - App-first with app selected:
//   - App info: 1 row
//   - Filters bar: 2 rows (border + single inline row)
//   - Filters margin: 1 row (marginTop in AppFirstMode)
//   - Results margin: 1 row (marginTop in AppFirstMode)
//   - Results box border: 2 rows (top + bottom)
//   - Results header: 1 row
//   - Boundary indicator: 1 row (when shown, need to account for it)
// WHITESPACE: Any remaining rows should show as empty space within the results list flexGrow area
const HEADER_ROWS = 3;
const FOOTER_ROWS = 3; // Fixed: was 2, but marginTop=1 + border box = 3 total
const APP_PADDING = 1;
const APP_INFO_ROWS = 1;
const FILTERS_ROWS = 3; // Compact: border + single inline row
const FILTERS_MARGIN = 1;
const RESULTS_OVERHEAD = 5; // margin + border(2) + header + boundary indicator space

// AppSelector overhead (when no app is selected):
// - Border: 2 rows
// - Title line: 1 row
// - Search box: 2 rows (margin + text)
// - List margin: 1 row
// - "... and X more" line: 1 row
const APP_SELECTOR_OVERHEAD = 7;

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => {
    const rows = process.stdout.rows || MIN_ROWS;
    const columns = process.stdout.columns || MIN_COLUMNS;
    const isTooSmall = rows < MIN_ROWS;
    const isTooNarrow = columns < MIN_COLUMNS;
    
    // Calculate available rows for results list
    // Total overhead when showing results in app-first mode:
    const totalOverhead = HEADER_ROWS + FOOTER_ROWS + APP_PADDING + APP_INFO_ROWS + FILTERS_ROWS + FILTERS_MARGIN + RESULTS_OVERHEAD;
    const availableRows = Math.max(5, rows - totalOverhead);
    
    // Calculate available rows for app selector (when no app is selected)
    const appSelectorOverhead = HEADER_ROWS + FOOTER_ROWS + APP_PADDING + APP_SELECTOR_OVERHEAD;
    const availableRowsForAppSelector = Math.max(5, rows - appSelectorOverhead);
    
    debugLog('🔍 Terminal Size Debug:');
    debugLog(`  Terminal: ${rows} rows × ${columns} cols`);
    debugLog(`  Overhead for Results: ${totalOverhead} rows (Header:${HEADER_ROWS} + Footer:${FOOTER_ROWS} + Padding:${APP_PADDING} + AppInfo:${APP_INFO_ROWS} + Filters:${FILTERS_ROWS} + FilterMargin:${FILTERS_MARGIN} + Results:${RESULTS_OVERHEAD})`);
    debugLog(`  Available for results: ${availableRows} rows`);
    debugLog(`  Overhead for AppSelector: ${appSelectorOverhead} rows`);
    debugLog(`  Available for app list: ${availableRowsForAppSelector} rows`);
    debugLog(`  ✅ WHITESPACE for Results: Shows as empty space in ResultsList (flexGrow area)`);
    debugLog(`  ✅ WHITESPACE for AppSelector: Shows as empty space after last app in list`);
    
    return {
      rows,
      columns,
      isTooSmall,
      isTooNarrow,
      availableRows,
      availableRowsForAppSelector,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const rows = process.stdout.rows || MIN_ROWS;
      const columns = process.stdout.columns || MIN_COLUMNS;
      const isTooSmall = rows < MIN_ROWS;
      const isTooNarrow = columns < MIN_COLUMNS;
      
      const totalOverhead = HEADER_ROWS + FOOTER_ROWS + APP_PADDING + APP_INFO_ROWS + FILTERS_ROWS + FILTERS_MARGIN + RESULTS_OVERHEAD;
      const availableRows = Math.max(5, rows - totalOverhead);
      
      const appSelectorOverhead = HEADER_ROWS + FOOTER_ROWS + APP_PADDING + APP_SELECTOR_OVERHEAD;
      const availableRowsForAppSelector = Math.max(5, rows - appSelectorOverhead);
      
      debugLog('🔍 Terminal Resized:');
      debugLog(`  New size: ${rows} rows × ${columns} cols`);
      debugLog(`  Available for results: ${availableRows} rows`);
      debugLog(`  Available for app list: ${availableRowsForAppSelector} rows`);
      debugLog(`  Whitespace should appear in flexGrow areas (not above Header!)`);
      debugLog(`  If text appears ABOVE Header, the root Box isn't filling terminal properly`);
      
      setSize({
        rows,
        columns,
        isTooSmall,
        isTooNarrow,
        availableRows,
        availableRowsForAppSelector,
      });
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return size;
}
