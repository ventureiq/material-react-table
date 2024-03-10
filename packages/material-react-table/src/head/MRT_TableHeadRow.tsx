import TableRow from '@mui/material/TableRow';
import { alpha, lighten } from '@mui/material/styles';
import { MRT_TableHeadCell } from './MRT_TableHeadCell';
import { type VirtualItem } from '@tanstack/react-virtual';
import {
  type MRT_Header,
  type MRT_HeaderGroup,
  type MRT_TableInstance,
} from '../types';

interface Props {
  headerGroup: MRT_HeaderGroup;
  table: MRT_TableInstance;
  virtualColumns?: VirtualItem[];
  virtualPaddingLeft?: number;
  virtualPaddingRight?: number;
  columnRecycleSlots?: any;
}

export const MRT_TableHeadRow = ({
  headerGroup,
  table,
  virtualColumns,
  virtualPaddingLeft,
  virtualPaddingRight,
  columnRecycleSlots
}: Props) => {
  const {
    options: { layoutMode, muiTableHeadRowProps },
  } = table;

  const tableRowProps =
    muiTableHeadRowProps instanceof Function
      ? muiTableHeadRowProps({ headerGroup, table })
      : muiTableHeadRowProps;

  return (
    <TableRow
      {...tableRowProps}
      sx={(theme) => ({
        backgroundColor: lighten(theme.palette.background.default, 0.04),
        boxShadow: `4px 0 8px ${alpha(theme.palette.common.black, 0.1)}`,
        display: layoutMode === 'grid' ? 'flex' : 'table-row',
        top: 0,
        ...(tableRowProps?.sx instanceof Function
          ? tableRowProps?.sx(theme)
          : (tableRowProps?.sx as any)),
      })}
    >
      {(virtualColumns && table.getLeftLeafColumns().length === 0) ? (
          <th key="vp_left"
              className="MuiTableCell-padding MuiTableCell-padding-left"
              style={{ display: 'flex', padding: '0px', width: virtualPaddingLeft }} />
      ) : null}
      {(virtualColumns ?? headerGroup.headers).map((headerOrVirtualHeader) => {
        const header = virtualColumns
          ? headerGroup.headers[headerOrVirtualHeader.index]
          : (headerOrVirtualHeader as MRT_Header);

        const slotIdx = virtualColumns ? columnRecycleSlots.slot(header.id)?.idx : header.id;
        const key = `key_${slotIdx}`;

        const renderedCell = <MRT_TableHeadCell key={key} header={header} table={table} />;
        if (virtualColumns && header.column.getIsPinned() === 'left' && header.column.getPinnedIndex() === (table.getLeftLeafColumns().length - 1)) {
            return [
                renderedCell,
                <th key="vp_left"
                    className="MuiTableCell-padding MuiTableCell-padding-left"
                    style={{ display: 'flex', padding: '0px', width: virtualPaddingLeft }} />,
            ]
        } else if (virtualColumns && header.column.getIsPinned() === 'right' && header.column.getPinnedIndex() === 0) {
            return [
                <th key="vp_right"
                    className="MuiTableCell-padding MuiTableCell-padding-right"
                    style={{ display: 'flex', padding: '0px', width: virtualPaddingRight }} />,
                renderedCell
            ]
        } else {
            return renderedCell;
        }
      })}
      {(virtualColumns && table.getRightLeafColumns().length === 0) ? (
          <th key="vp_right" style={{ display: 'flex', padding: '0px', width: virtualPaddingRight }} />
      ) : null}
    </TableRow>
  );
};
