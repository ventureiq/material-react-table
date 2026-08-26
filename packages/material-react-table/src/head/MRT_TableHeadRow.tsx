import TableRow from '@mui/material/TableRow';
import { alpha, lighten } from '@mui/material/styles';
import { MRT_TableHeadCell } from './MRT_TableHeadCell';
import { getColumnGeometry } from '../column.utils';
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

  // hoisted out of the map: it was resolved once per header, and getLeftLeafColumns is only
  // memoized, not free
  const leftLeafColumnCount = table.getLeftLeafColumns().length;

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
      {(virtualColumns && leftLeafColumnCount === 0) ? (
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
        const geometry = getColumnGeometry(table, header.column);
        if (virtualColumns && geometry.pinned === 'left' && geometry.pinnedIndex === (leftLeafColumnCount - 1)) {
            return [
                renderedCell,
                <th key="vp_left"
                    className="MuiTableCell-padding MuiTableCell-padding-left"
                    style={{ display: 'flex', padding: '0px', width: virtualPaddingLeft }} />,
            ]
        } else if (virtualColumns && geometry.isFirstRightPinned) {
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
