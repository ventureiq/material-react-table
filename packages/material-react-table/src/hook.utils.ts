import {useMemo, useRef} from "react";

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
