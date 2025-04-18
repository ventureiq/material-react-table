import TableHead from '@mui/material/TableHead';
import { MRT_TableHeadRow } from './MRT_TableHeadRow';
import { type VirtualItem } from '@tanstack/react-virtual';
import { type MRT_TableInstance } from '../types';

interface Props {
  table: MRT_TableInstance;
  virtualColumns?: VirtualItem[];
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  columnRecycleSlots?: any;
}

export const MRT_TableHead = ({
  table,
  virtualColumns,
  virtualPaddingLeft,
  virtualPaddingRight,
  columnRecycleSlots
}: Props) => {
  const {
    getHeaderGroups,
    getState,
    options: { enableStickyHeader, layoutMode, muiTableHeadProps },
  } = table;
  const { isFullScreen } = getState();

  const tableHeadProps =
    muiTableHeadProps instanceof Function
      ? muiTableHeadProps({ table })
      : muiTableHeadProps;

  const stickyHeader = enableStickyHeader || isFullScreen;

  return (
    <TableHead
      {...tableHeadProps}
      sx={(theme) => ({
        display: layoutMode === 'grid' ? 'grid' : 'table-row-group',
        opacity: 0.97,
        position: stickyHeader ? 'sticky' : 'relative',
        top: stickyHeader && layoutMode === 'grid' ? 0 : undefined,
        zIndex: stickyHeader ? 2 : undefined,
        ...(tableHeadProps?.sx instanceof Function
          ? tableHeadProps?.sx(theme)
          : (tableHeadProps?.sx as any)),
      })}
    >
      {getHeaderGroups().map((headerGroup) => (
        <MRT_TableHeadRow
          headerGroup={headerGroup as any}
          key={headerGroup.id}
          table={table}
          virtualColumns={virtualColumns}
          virtualPaddingLeft={virtualPaddingLeft}
          virtualPaddingRight={virtualPaddingRight}
          columnRecycleSlots={columnRecycleSlots}
        />
      ))}
    </TableHead>
  );
};
