import { useState, useEffect } from 'react';

export interface TerminalSize {
  rows: number;
  columns: number;
  isTooSmall: boolean;
  isTooNarrow: boolean;
  availableRows: number;
}

const MIN_ROWS = 20;
const MIN_COLUMNS = 80;
const HEADER_ROWS = 3;
const FOOTER_ROWS = 2;
const FILTERS_ROWS = 3;
const RESULTS_HEADER_ROWS = 2;
const PADDING_ROWS = 2;

export function useTerminalSize(): TerminalSize {
  const [size, setSize] = useState<TerminalSize>(() => {
    const rows = process.stdout.rows || MIN_ROWS;
    const columns = process.stdout.columns || MIN_COLUMNS;
    const isTooSmall = rows < MIN_ROWS;
    const isTooNarrow = columns < MIN_COLUMNS;
    const availableRows = Math.max(5, rows - HEADER_ROWS - FOOTER_ROWS - FILTERS_ROWS - RESULTS_HEADER_ROWS - PADDING_ROWS);
    
    return {
      rows,
      columns,
      isTooSmall,
      isTooNarrow,
      availableRows,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const rows = process.stdout.rows || MIN_ROWS;
      const columns = process.stdout.columns || MIN_COLUMNS;
      const isTooSmall = rows < MIN_ROWS;
      const isTooNarrow = columns < MIN_COLUMNS;
      const availableRows = Math.max(5, rows - HEADER_ROWS - FOOTER_ROWS - FILTERS_ROWS - RESULTS_HEADER_ROWS - PADDING_ROWS);
      
      setSize({
        rows,
        columns,
        isTooSmall,
        isTooNarrow,
        availableRows,
      });
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
    };
  }, []);

  return size;
}
