import { type DragEvent, memo, useRef } from 'react';
import TableRow from '@mui/material/TableRow';
import { type Theme, alpha, darken, lighten } from '@mui/material/styles';
import { Memo_MRT_TableBodyCell, MRT_TableBodyCell } from './MRT_TableBodyCell';
import { MRT_TableDetailPanel } from './MRT_TableDetailPanel';
import { type VirtualItem, type Virtualizer } from '@tanstack/react-virtual';
import { type MRT_Cell, type MRT_Row, type MRT_TableInstance } from '../types';

interface Props {
  columnVirtualizer?: Virtualizer<HTMLDivElement, HTMLTableCellElement>;
  measureElement?: (element: HTMLTableRowElement) => void;
  numRows: number;
  row: MRT_Row;
  rowIndex: number;
  table: MRT_TableInstance;
  virtualColumns?: VirtualItem[];
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  virtualRow?: VirtualItem;
  columnRecycleSlots?: any;
}

export const MRT_TableBodyRow = ({
  columnVirtualizer,
  measureElement,
  numRows,
  row,
  rowIndex,
  table,
  virtualColumns,
  virtualPaddingLeft,
  virtualPaddingRight,
  virtualRow,
  columnRecycleSlots
}: Props) => {
  const {
    getState,
    options: {
      enableRowOrdering,
      layoutMode,
      memoMode,
      muiTableBodyRowProps,
      renderDetailPanel,
    },
    setHoveredRow,
  } = table;
  const { draggingColumn, draggingRow, editingCell, editingRow, hoveredRow } =
    getState();

  const tableRowProps =
    muiTableBodyRowProps instanceof Function
      ? muiTableBodyRowProps({ row, staticRowIndex: rowIndex, table })
      : muiTableBodyRowProps;

  const handleDragEnter = (_e: DragEvent) => {
    if (enableRowOrdering && draggingRow) {
      setHoveredRow(row);
    }
  };

  const rowRef = useRef<HTMLTableRowElement | null>(null);

  return (
    <>
      <TableRow
        data-index={virtualRow?.index}
        onDragEnter={handleDragEnter}
        selected={row.getIsSelected()}
        ref={(node: HTMLTableRowElement) => {
          if (node) {
            rowRef.current = node;
            measureElement?.(node);
          }
        }}
        {...tableRowProps}
        sx={(theme: Theme) => ({
          backgroundColor: lighten(theme.palette.background.default, 0.06),
          boxSizing: 'border-box',
          display: layoutMode === 'grid' ? 'flex' : 'table-row',
          opacity:
            draggingRow?.id === row.id || hoveredRow?.id === row.id ? 0.5 : 1,
          position: virtualRow ? 'absolute' : undefined,
          transition: virtualRow ? 'none' : 'all 150ms ease-in-out',
          top: virtualRow ? 0 : undefined,
          width: '100%',
          '&:hover td': {
            backgroundColor:
              tableRowProps?.hover !== false
                ? row.getIsSelected()
                  ? `${alpha(theme.palette.primary.main, 0.2)}`
                  : theme.palette.mode === 'dark'
                  ? `${lighten(theme.palette.background.default, 0.12)}`
                  : `${darken(theme.palette.background.default, 0.05)}`
                : undefined,
          },
          ...(tableRowProps?.sx instanceof Function
            ? tableRowProps.sx(theme)
            : (tableRowProps?.sx as any)),
        })}
        style={{
          transform: virtualRow
            ? `translateY(${virtualRow?.start}px)`
            : undefined,
          ...tableRowProps?.style,
        }}
      >
        {(virtualColumns && table.getLeftLeafColumns().length === 0) ? (
            <td key="vp_left"
                className="MuiTableCell-padding MuiTableCell-padding-left"
                style={{ display: 'flex', padding: '0px', width: virtualPaddingLeft }} />
        ) : null}
        {(virtualColumns ?? row.getVisibleCells()).map((cellOrVirtualCell) => {
          const cell = columnVirtualizer
            ? row.getVisibleCells()[(cellOrVirtualCell as VirtualItem).index]
            : (cellOrVirtualCell as MRT_Cell);

          const slotIdx = virtualColumns ? columnRecycleSlots.slot(cell.column.id)?.idx : cell.column.id;
          const virtualColumn = virtualColumns ? virtualColumns?.[columnRecycleSlots.slot(cell.column.id)?.row] : cellOrVirtualCell;
          const key = `key_${slotIdx}`;

          const props = {
            cell,
            measureElement: columnVirtualizer?.measureElement,
            numRows,
            rowIndex,
            rowRef,
            table,
            virtualCell: columnVirtualizer
              ? (virtualColumn as VirtualItem)
              : undefined,
          };
          const renderedCell = memoMode === 'cells' &&
            cell.column.columnDef.columnDefType === 'data' &&
            !draggingColumn &&
            !draggingRow &&
            editingCell?.id !== cell.id &&
            editingRow?.id !== row.id ? (
            <Memo_MRT_TableBodyCell key={key} {...props} />
          ) : (
            <MRT_TableBodyCell key={key} {...props} />
          );

          if (virtualColumns && cell.column.getIsPinned() === 'left' && cell.column.getPinnedIndex() === (table.getLeftLeafColumns().length - 1)) {
            return [
              renderedCell,
              <td key="vp_left"
                  className="MuiTableCell-padding MuiTableCell-padding-left"
                  style={{ display: 'flex', padding: '0px', width: virtualPaddingLeft }} />,
            ]
          } else if (virtualColumns && cell.column.getIsPinned() === 'right' && cell.column.getPinnedIndex() === 0) {
            return [
              <td key="vp_right"
                  className="MuiTableCell-padding MuiTableCell-padding-right"
                  style={{ display: 'flex', padding: '0px', width: virtualPaddingRight }} />,
              renderedCell
            ]
          } else {
            return renderedCell;
          }
        })}
        {(virtualColumns && table.getRightLeafColumns().length === 0) ? (
          <td key="vp_right"
              className="MuiTableCell-padding MuiTableCell-padding-right"
              style={{ display: 'flex', padding: '0px', width: virtualPaddingRight }} />
        ) : null}
      </TableRow>
      {renderDetailPanel && !row.getIsGrouped() && (
        <MRT_TableDetailPanel
          parentRowRef={rowRef}
          row={row}
          rowIndex={rowIndex}
          table={table}
          virtualRow={virtualRow}
        />
      )}
    </>
  );
};

export const Memo_MRT_TableBodyRow = memo(
  MRT_TableBodyRow,
  (prev, next) => prev.row === next.row && prev.rowIndex === next.rowIndex,
);
