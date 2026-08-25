import { alpha, lighten } from '@mui/material/styles';
import { type MRT_AggregationFns } from './aggregationFns';
import { type MRT_FilterFns } from './filterFns';
import { type MRT_SortingFns } from './sortingFns';
import { type Row } from '@tanstack/react-table';
import { type TableCellProps } from '@mui/material/TableCell';
import { type Theme } from '@mui/material/styles';
import {
  type MaterialReactTableProps,
  type MRT_Column,
  type MRT_ColumnDef,
  type MRT_ColumnOrderState,
  type MRT_DefinedColumnDef,
  type MRT_DisplayColumnIds,
  type MRT_FilterOption,
  type MRT_GroupingState,
  type MRT_Header,
  type MRT_TableInstance,
} from './types';

export const getColumnId = <TData extends Record<string, any> = {}>(
  columnDef: MRT_ColumnDef<TData>,
): string =>
  columnDef.id ?? columnDef.accessorKey?.toString?.() ?? columnDef.header;

export const getAllLeafColumnDefs = <TData extends Record<string, any> = {}>(
  columns: MRT_ColumnDef<TData>[],
): MRT_ColumnDef<TData>[] => {
  const allLeafColumnDefs: MRT_ColumnDef<TData>[] = [];
  const getLeafColumns = (cols: MRT_ColumnDef<TData>[]) => {
    cols.forEach((col) => {
      if (col.columns) {
        getLeafColumns(col.columns);
      } else {
        allLeafColumnDefs.push(col);
      }
    });
  };
  getLeafColumns(columns);
  return allLeafColumnDefs;
};

export const prepareColumns = <TData extends Record<string, any> = {}>({
  aggregationFns,
  columnDefs,
  columnFilterFns,
  defaultDisplayColumn,
  filterFns,
  sortingFns,
}: {
  aggregationFns: typeof MRT_AggregationFns &
    MaterialReactTableProps<TData>['aggregationFns'];
  columnDefs: MRT_ColumnDef<TData>[];
  columnFilterFns: { [key: string]: MRT_FilterOption };
  defaultDisplayColumn: Partial<MRT_ColumnDef<TData>>;
  filterFns: typeof MRT_FilterFns & MaterialReactTableProps<TData>['filterFns'];
  sortingFns: typeof MRT_SortingFns &
    MaterialReactTableProps<TData>['sortingFns'];
}): MRT_DefinedColumnDef<TData>[] =>
  columnDefs.map((columnDef) => {
    //assign columnId
    if (!columnDef.id) columnDef.id = getColumnId(columnDef);
    if (process.env.NODE_ENV !== 'production' && !columnDef.id) {
      console.error(
        'Column definitions must have a valid `accessorKey` or `id` property',
      );
    }

    //assign columnDefType
    if (!columnDef.columnDefType) columnDef.columnDefType = 'data';
    if (columnDef.columns?.length) {
      columnDef.columnDefType = 'group';
      //recursively prepare columns if this is a group column
      columnDef.columns = prepareColumns({
        aggregationFns,
        columnDefs: columnDef.columns,
        columnFilterFns,
        defaultDisplayColumn,
        filterFns,
        sortingFns,
      });
    } else if (columnDef.columnDefType === 'data') {
      //assign aggregationFns if multiple aggregationFns are provided
      if (Array.isArray(columnDef.aggregationFn)) {
        const aggFns = columnDef.aggregationFn as string[];
        columnDef.aggregationFn = (
          columnId: string,
          leafRows: Row<TData>[],
          childRows: Row<TData>[],
        ) =>
          aggFns.map((fn) =>
            aggregationFns[fn]?.(columnId, leafRows, childRows),
          );
      }

      //assign filterFns
      if (Object.keys(filterFns).includes(columnFilterFns[columnDef.id])) {
        columnDef.filterFn =
          filterFns[columnFilterFns[columnDef.id]] ?? filterFns.fuzzy;
        (columnDef as MRT_DefinedColumnDef)._filterFn =
          columnFilterFns[columnDef.id];
      }

      //assign sortingFns
      if (Object.keys(sortingFns).includes(columnDef.sortingFn as string)) {
        // @ts-ignore
        columnDef.sortingFn = sortingFns[columnDef.sortingFn];
      }
    } else if (columnDef.columnDefType === 'display') {
      columnDef = {
        ...(defaultDisplayColumn as MRT_ColumnDef<TData>),
        ...columnDef,
      };
    }
    return columnDef;
  }) as MRT_DefinedColumnDef<TData>[];

export const reorderColumn = <TData extends Record<string, any> = {}>(
  draggedColumn: MRT_Column<TData>,
  targetColumn: MRT_Column<TData>,
  columnOrder: MRT_ColumnOrderState,
): MRT_ColumnOrderState => {
  if (draggedColumn.getCanPin()) {
    draggedColumn.pin(targetColumn.getIsPinned());
  }
  const newColumnOrder = [...columnOrder];
  newColumnOrder.splice(
    newColumnOrder.indexOf(targetColumn.id),
    0,
    newColumnOrder.splice(newColumnOrder.indexOf(draggedColumn.id), 1)[0],
  );
  return newColumnOrder;
};

export const showExpandColumn = <TData extends Record<string, any> = {}>(
  props: MaterialReactTableProps<TData>,
  grouping?: MRT_GroupingState,
) =>
  !!(
    props.enableExpanding ||
    (props.enableGrouping && (grouping === undefined || grouping?.length)) ||
    props.renderDetailPanel
  );

export const getLeadingDisplayColumnIds = <
  TData extends Record<string, any> = {},
>(
  props: MaterialReactTableProps<TData>,
) =>
  [
    (props.enableRowDragging || props.enableRowOrdering) && 'mrt-row-drag',
    props.positionActionsColumn === 'first' &&
      (props.enableRowActions ||
        (props.enableEditing &&
          ['row', 'modal'].includes(props.editingMode ?? ''))) &&
      'mrt-row-actions',
    props.positionExpandColumn === 'first' &&
      showExpandColumn(props) &&
      'mrt-row-expand',
    props.enableRowSelection && 'mrt-row-select',
    props.enableRowNumbers && 'mrt-row-numbers',
  ].filter(Boolean) as MRT_DisplayColumnIds[];

export const getTrailingDisplayColumnIds = <
  TData extends Record<string, any> = {},
>(
  props: MaterialReactTableProps<TData>,
) =>
  [
    props.positionActionsColumn === 'last' &&
      (props.enableRowActions ||
        (props.enableEditing &&
          ['row', 'modal'].includes(props.editingMode ?? ''))) &&
      'mrt-row-actions',
    props.positionExpandColumn === 'last' &&
      showExpandColumn(props) &&
      'mrt-row-expand',
  ].filter(Boolean) as MRT_DisplayColumnIds[];

export const getDefaultColumnOrderIds = <
  TData extends Record<string, any> = {},
>(
  props: MaterialReactTableProps<TData>,
) => {
  const leadingDisplayCols: string[] = getLeadingDisplayColumnIds(props);
  const trailingDisplayCols: string[] = getTrailingDisplayColumnIds(props);
  const allLeafColumnDefs = getAllLeafColumnDefs(props.columns)
    .map((columnDef) => getColumnId(columnDef))
    .filter(
      (columnId) =>
        !leadingDisplayCols.includes(columnId) &&
        !trailingDisplayCols.includes(columnId),
    );
  return [...leadingDisplayCols, ...allLeafColumnDefs, ...trailingDisplayCols];
};

export const getDefaultColumnFilterFn = <
  TData extends Record<string, any> = {},
>(
  columnDef: MRT_ColumnDef<TData>,
): MRT_FilterOption => {
  if (columnDef.filterVariant === 'multi-select') return 'arrIncludesSome';
  if (
    columnDef.filterVariant === 'range' ||
    columnDef.filterVariant === 'range-slider'
  )
    return 'betweenInclusive';
  if (
    columnDef.filterVariant === 'select' ||
    columnDef.filterVariant === 'checkbox'
  )
    return 'equals';
  return 'fuzzy';
};

export const getIsFirstColumn = (
  column: MRT_Column,
  table: MRT_TableInstance,
) => {
  return table.getVisibleLeafColumns()[0].id === column.id;
};

export const getIsLastColumn = (
  column: MRT_Column,
  table: MRT_TableInstance,
) => {
  const columns = table.getVisibleLeafColumns();
  return columns[columns.length - 1].id === column.id;
};

export const getIsLastLeftPinnedColumn = (
  table: MRT_TableInstance,
  column: MRT_Column,
) => {
  return (
    column.getIsPinned() === 'left' &&
    table.getLeftLeafHeaders().length - 1 === column.getPinnedIndex()
  );
};

export const getIsFirstRightPinnedColumn = (column: MRT_Column) => {
  return column.getIsPinned() === 'right' && column.getPinnedIndex() === 0;
};

export const getTotalRight = (table: MRT_TableInstance, column: MRT_Column) => {
  return table
    .getRightLeafHeaders()
    .slice(column.getPinnedIndex() + 1)
    .reduce((acc, col) => acc + col.getSize(), 0);
};

export const getCommonCellStyles = ({
  column,
  header,
  table,
  tableCellProps,
  theme,
}: {
  column: MRT_Column;
  header?: MRT_Header;
  table: MRT_TableInstance;
  tableCellProps: TableCellProps;
  theme: Theme;
}) => {
  // this runs for every cell of every row. Nothing below can change mid-expression,
  // so each of these is read once instead of repeatedly: getIsPinned() was called
  // six times, and it is not cheap - it maps every leaf column id and scans the
  // pinning arrays twice. getState() was read four times, parseCSSVarId three.
  const { enableColumnResizing, enableColumnVirtualization, layoutMode } =
    table.options;
  const state = table.getState();
  const pinned = column.getIsPinned();
  const isGroup = column.columnDef.columnDefType === 'group';
  const sizeVar = `${header ? 'header' : 'col'}-${parseCSSVarId(
    header?.id ?? column.id,
  )}`;

  // getPinnedIndex() calls getIsPinned() again internally, so it stays behind the
  // same short circuits the original had
  const isLeftEdge =
    enableColumnVirtualization && pinned === 'left' && column.getPinnedIndex() === 0;
  const isRightEdge =
    enableColumnVirtualization &&
    pinned === 'right' &&
    column.getPinnedIndex() === table.getVisibleLeafColumns().length - 1;

  const widthStyles = {
    minWidth: `max(calc(var(--${sizeVar}-size) * 1px), ${
      column.columnDef.minSize ?? 30
    }px)`,
    width: `calc(var(--${sizeVar}-size) * 1px)`,
  };
  return {
    backgroundColor:
      pinned && !isGroup
        ? alpha(lighten(theme.palette.background.default, 0.04), 0.97)
        : 'inherit',
    backgroundImage: 'inherit',
    boxShadow: getIsLastLeftPinnedColumn(table, column)
      ? `-4px 0 8px -6px ${alpha(theme.palette.common.black, 0.2)} inset`
      : getIsFirstRightPinnedColumn(column)
      ? `4px 0 8px -6px ${alpha(theme.palette.common.black, 0.2)} inset`
      : undefined,
    display: layoutMode === 'grid' ? 'flex' : 'table-cell',
    flex: layoutMode === 'grid' ? `var(--${sizeVar}-size) 0 auto` : undefined,
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    ml: isLeftEdge
      ? `-${column.getSize() * (state.columnPinning.left?.length ?? 1)}px`
      : undefined,
    mr: isRightEdge
      ? `-${
          column.getSize() * (state.columnPinning.right?.length ?? 1) * 1.2
        }px`
      : undefined,
    opacity:
      state.draggingColumn?.id === column.id ||
      state.hoveredColumn?.id === column.id
        ? 0.5
        : 1,
    position: pinned && !isGroup ? 'sticky' : undefined,
    right: pinned === 'right' ? `${getTotalRight(table, column)}px` : undefined,
    transition: enableColumnVirtualization
      ? 'none'
      : `padding 150ms ease-in-out`,
    ...(!enableColumnResizing && widthStyles), //let devs pass in width styles if column resizing is disabled
    ...(tableCellProps?.sx instanceof Function
      ? tableCellProps.sx(theme)
      : (tableCellProps?.sx as any)),
    ...(enableColumnResizing && widthStyles), //don't let devs pass in width styles if column resizing is enabled
  };
};

export const MRT_DefaultColumn = {
  filterVariant: 'text',
  minSize: 40,
  maxSize: 1000,
  size: 180,
} as const;

export const MRT_DefaultDisplayColumn = {
  columnDefType: 'display',
  enableClickToCopy: false,
  enableColumnActions: false,
  enableColumnDragging: false,
  enableColumnFilter: false,
  enableColumnOrdering: false,
  enableEditing: false,
  enableGlobalFilter: false,
  enableGrouping: false,
  enableHiding: false,
  enableResizing: false,
  enableSorting: false,
} as const;

export const parseCSSVarId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '_');
