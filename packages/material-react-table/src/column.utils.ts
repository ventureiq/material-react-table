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
  type MRT_ColumnGeometry,
  type MRT_TableGeometry,
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

// Every value below is a property of the COLUMN, never of the cell - yet each one used to be
// recomputed for every cell of every row. getIsPinned() maps a column's leaf ids and scans both
// pinning arrays, getPinnedIndex() calls it again internally, and getStart() recurses through
// every preceding column while re-deriving getVisibleLeafColumns() at each level. Rendering one
// screen of a wide table ran that thousands of times to produce one value per column.
//
// buildColumnGeometry computes all of them once per render in a few linear passes. It is
// assigned to the table instance in MRT_TableRoot, which owns the state these derive from, so
// what a cell reads is always from the current render - no cache key, nothing to invalidate.
export const buildColumnGeometry = (
  table: MRT_TableInstance,
): MRT_TableGeometry => {
  const { columnPinning } = table.getState();
  // kept raw: `?? 1` below distinguishes an absent array from an empty one, and the original
  // margin expressions depend on that difference
  const left = columnPinning?.left;
  const right = columnPinning?.right;

  const visible = table.getVisibleLeafColumns();
  const visibleCount = visible.length;
  const visibleIndexes: Record<string, number> = {};
  visible.forEach((column, index) => {
    visibleIndexes[column.id] = index;
  });

  // getStart('left') is a prefix sum over the left-pinned visible columns - one pass here
  // instead of a recursion per cell
  const starts: Record<string, number> = {};
  let offset = 0;
  table.getLeftVisibleLeafColumns().forEach((column) => {
    starts[column.id] = offset;
    offset += column.getSize();
  });

  // getTotalRight is the suffix sum over the right-pinned headers, indexed by pinned index
  const rightHeaders = table.getRightLeafHeaders();
  const rightSuffix: number[] = new Array(rightHeaders.length + 1).fill(0);
  for (let i = rightHeaders.length - 1; i >= 0; i--) {
    rightSuffix[i] = rightSuffix[i + 1] + rightHeaders[i].getSize();
  }

  const leftHeaders = table.getLeftLeafHeaders();
  const leftHeaderCount = leftHeaders.length;
  const totalLeftWidth = leftHeaders.reduce((sum, header) => {
    return sum + header.column.getSize();
  }, 0);

  const columns: Record<string, MRT_ColumnGeometry> = {};

  // flat, so group columns are covered too - their pinned state reads from their leaves,
  // exactly as table-core's getIsPinned does
  table.getAllFlatColumns().forEach((column) => {
    const leafIds = column.getLeafColumns().map((d) => d.id);
    const isLeft = leafIds.some((id) => left?.includes(id));
    const isRight = leafIds.some((id) => right?.includes(id));
    const pinned = isLeft ? 'left' : isRight ? 'right' : false;
    // table-core returns 0 for an unpinned column, and -1 for a pinned one whose own id is not
    // in the array (a group). Both are preserved.
    const pinnedIndex = pinned
      ? (pinned === 'left' ? left : right)?.indexOf(column.id) ?? -1
      : 0;
    const size = column.getSize();
    const index = visibleIndexes[column.id] ?? -1;

    columns[column.id] = {
      index,
      isFirstColumn: index === 0,
      isFirstLeftPinned: pinned === 'left' && pinnedIndex === 0,
      isFirstRightPinned: pinned === 'right' && pinnedIndex === 0,
      isLastColumn: index === visibleCount - 1,
      isLastLeftPinned: pinned === 'left' && leftHeaderCount - 1 === pinnedIndex,
      isLastRightPinned:
        pinned === 'right' && pinnedIndex === rightHeaders.length - 1,
      marginLeft: size * (left?.length ?? 1),
      marginRight: size * (right?.length ?? 1) * 1.2,
      minSize: column.columnDef.minSize ?? 30,
      pinned,
      pinnedIndex,
      size,
      start: starts[column.id] ?? 0,
      totalRight: rightSuffix[pinnedIndex + 1] ?? 0,
    };
  });

  return {
    columns,
    totalLeftWidth,
    totalRightWidth: rightSuffix[0],
    visibleCount,
  };
};

const EMPTY_COLUMN_GEOMETRY: MRT_ColumnGeometry = {
  index: -1,
  isFirstColumn: false,
  isFirstLeftPinned: false,
  isFirstRightPinned: false,
  isLastColumn: false,
  isLastLeftPinned: false,
  isLastRightPinned: false,
  marginLeft: 0,
  marginRight: 0,
  minSize: 30,
  pinned: false,
  pinnedIndex: 0,
  size: 0,
  start: 0,
  totalRight: 0,
};

const EMPTY_TABLE_GEOMETRY: MRT_TableGeometry = {
  columns: {},
  totalLeftWidth: 0,
  totalRightWidth: 0,
  visibleCount: 0,
};

export const getTableGeometry = (
  table: MRT_TableInstance,
): MRT_TableGeometry => {
  return table.columnGeometry ?? EMPTY_TABLE_GEOMETRY;
};

// takes anything with an id, so callers holding a raw table-core Column (getVisibleLeafColumns)
// do not need a cast
export const getColumnGeometry = (
  table: MRT_TableInstance,
  column: { id: string },
): MRT_ColumnGeometry => {
  return table.columnGeometry?.columns?.[column.id] ?? EMPTY_COLUMN_GEOMETRY;
};

export const getIsFirstColumn = (
  column: MRT_Column,
  table: MRT_TableInstance,
) => {
  return getColumnGeometry(table, column).isFirstColumn;
};

export const getIsLastColumn = (
  column: MRT_Column,
  table: MRT_TableInstance,
) => {
  return getColumnGeometry(table, column).isLastColumn;
};

export const getIsLastLeftPinnedColumn = (
  table: MRT_TableInstance,
  column: MRT_Column,
) => {
  return getColumnGeometry(table, column).isLastLeftPinned;
};

export const getIsFirstRightPinnedColumn = (
  column: MRT_Column,
  table: MRT_TableInstance,
) => {
  return getColumnGeometry(table, column).isFirstRightPinned;
};

export const getTotalRight = (table: MRT_TableInstance, column: MRT_Column) => {
  return getColumnGeometry(table, column).totalRight;
};

export const getCommonCellStyles = ({
  column,
  table,
  tableCellProps,
  theme,
}: {
  column: MRT_Column;
  header?: MRT_Header; // consumed by getCommonCellVars, not here
  table: MRT_TableInstance;
  tableCellProps: TableCellProps;
  theme: Theme;
}) => {
  const { enableColumnResizing, enableColumnVirtualization, layoutMode } =
    table.options;
  const state = table.getState();
  const geometry = getColumnGeometry(table, column);
  const pinned = geometry.pinned;
  const isGroup = column.columnDef.columnDefType === 'group';

  const isLeftEdge = enableColumnVirtualization && geometry.isFirstLeftPinned;
  const isRightEdge =
    enableColumnVirtualization &&
    pinned === 'right' &&
    geometry.pinnedIndex === getTableGeometry(table).visibleCount - 1;

  // Fixed names, so the css text is identical for every column. The per-column values are
  // set inline by getCommonCellVars below: putting `--${sizeVar}-size` or a computed pixel
  // straight into the rule makes the class unique per column, and with custom fields the
  // column ids are data - a class per client field, none of it ever cacheable.
  const widthStyles = {
    minWidth: `max(calc(var(--mrt-size) * 1px), var(--mrt-min-size))`,
    width: `calc(var(--mrt-size) * 1px)`,
  };
  return {
    backgroundColor:
      pinned && !isGroup
        ? alpha(lighten(theme.palette.background.default, 0.04), 0.97)
        : 'inherit',
    backgroundImage: 'inherit',
    boxShadow: geometry.isLastLeftPinned
      ? `-4px 0 8px -6px ${alpha(theme.palette.common.black, 0.2)} inset`
      : geometry.isFirstRightPinned
      ? `4px 0 8px -6px ${alpha(theme.palette.common.black, 0.2)} inset`
      : undefined,
    display: layoutMode === 'grid' ? 'flex' : 'table-cell',
    flex: layoutMode === 'grid' ? `var(--mrt-size) 0 auto` : undefined,
    left: pinned === 'left' ? `var(--mrt-left)` : undefined,
    ml: isLeftEdge ? `var(--mrt-ml)` : undefined,
    mr: isRightEdge ? `var(--mrt-mr)` : undefined,
    opacity:
      state.draggingColumn?.id === column.id ||
      state.hoveredColumn?.id === column.id
        ? 0.5
        : 1,
    position: pinned && !isGroup ? 'sticky' : undefined,
    right: pinned === 'right' ? `var(--mrt-right)` : undefined,
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

// The values behind the fixed names above, set as inline custom properties on the cell.
// The table already publishes every column's size as `--mrt-header-x-size` / `--mrt-col-x-size` in
// one inline style on the <table> (MRT_Table), so this only aliases it - resizing keeps
// flowing through exactly the same path.
export const getCommonCellVars = ({
  column,
  header,
  table,
}: {
  column: MRT_Column;
  header?: MRT_Header;
  table: MRT_TableInstance;
}) => {
  const geometry = getColumnGeometry(table, column);
  const sizeVar = `${header ? 'mrt-header' : 'mrt-col'}-${parseCSSVarId(
    header?.id ?? column.id,
  )}`;

  return {
    '--mrt-size': `var(--${sizeVar}-size)`,
    '--mrt-min-size': `${geometry.minSize}px`,
    ...(geometry.pinned === 'left'
      ? {'--mrt-left': `${geometry.start}px`}
      : null),
    ...(geometry.pinned === 'right'
      ? {'--mrt-right': `${geometry.totalRight}px`}
      : null),
    '--mrt-ml': `-${geometry.marginLeft}px`,
    '--mrt-mr': `-${geometry.marginRight}px`,
  } as Record<string, string>;
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
