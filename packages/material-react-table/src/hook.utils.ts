import {useMemo, useRef} from "react";
import {buildColumnGeometry} from "./column.utils";
import {type MRT_TableGeometry, type MRT_TableInstance} from "./types";

// One geometry record per column, rebuilt only when something that can move a column changes.
// `table` is deliberately not a dependency: the instance object is rebuilt on every render of
// MRT_TableRoot, so including it would defeat the memo. Same convention as columnSizeVars in
// MRT_Table.
export const useColumnGeometry = (
  table: MRT_TableInstance,
): MRT_TableGeometry => {
  const {
    columnOrder,
    columnPinning,
    columnSizing,
    columnSizingInfo,
    columnVisibility,
  } = table.getState();

  return useMemo(
    () => buildColumnGeometry(table),
    [
      table.options.columns,
      columnOrder,
      columnPinning,
      columnSizing,
      columnSizingInfo,
      columnVisibility,
    ],
  );
};

export const useRecycleSlots = ():{ refresh: (rows: any, items: any) => void; slot: (id: any) => any } => {
  const recycleSlotsRef = useRef<{[x: string]: { idx: number; row: any; }; }>({});

  return useMemo(() => {
    return {
      slot: (id) => recycleSlotsRef.current[id],
      refresh: (rows, items) => {
        const recycleSlotsNew: { [x: string]: { idx: number; row: any; }; } = {},
          usedSlots: {[x: string]: boolean} = {};
        rows.forEach((r: { index: string | number; }, rIdx: any) => {
          const item = items[r.index];
          if (recycleSlotsRef.current[item.id]) {
            recycleSlotsNew[item.id] = {
              idx: recycleSlotsRef.current[item.id].idx,
              row: rIdx
            };
            usedSlots[recycleSlotsRef.current[item.id].idx] = true;
          }
        });
        rows.forEach((r: { index: string | number; }, rIdx: any) => {
          const item = items[r.index];
          if (!recycleSlotsNew[item.id]) {
            const idx = (new Array(rows.length).fill(null)
              .findIndex((_, idx) => !usedSlots[idx]));
            recycleSlotsNew[item.id] = {
              idx: idx,
              row: rIdx
            };
            usedSlots[idx] = true;
          }
        });
        recycleSlotsRef.current = recycleSlotsNew;
      }
    }
  }, []);
}
