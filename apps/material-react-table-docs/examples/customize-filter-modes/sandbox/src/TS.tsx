import React, { useMemo } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MenuItem } from '@mui/material';
import { data, type Person } from './makeData';

const Example = () => {
  const columns = useMemo<MRT_ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'id',
        enableColumnFilterModes: false, //disable changing filter mode for this column
        filterFn: 'equals', //set filter mode to equals
        header: 'ID',
      },
      {
        accessorKey: 'firstName', //normal, all filter modes are enabled
        header: 'First Name',
      },
      {
        accessorKey: 'middleName',
        enableColumnFilterModes: false, //disable changing filter mode for this column
        filterFn: 'startsWith', //even though changing the mode is disabled, you can still set the default filter mode
        header: 'Middle Name',
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        //if you do not want to use the default filter modes, you can provide your own and render your own menu
        renderColumnFilterModeMenuItems: ({ onSelectFilterMode }) => [
          <MenuItem key="0" onClick={() => onSelectFilterMode('contains')}>
            <div>Contains</div>
          </MenuItem>,
          <MenuItem
            key="1"
            onClick={() => onSelectFilterMode('customFilterFn')}
          >
            <div>Custom Filter Fn</div>
          </MenuItem>,
        ],
      },
      {
        accessorKey: 'age',
        columnFilterModeOptions: ['between', 'greaterThan', 'lessThan'], //only allow these filter modes
        filterFn: 'between',
        header: 'Age',
      },
    ],
    [],
  );

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableColumnFilterModes //enable changing filter mode for all columns unless explicitly disabled in a column def
      initialState={{ showColumnFilters: true }} //show filters by default
      filterFns={{
        customFilterFn: (row, id, filterValue) => {
          return row.getValue(id) === filterValue;
        },
      }}
      localization={
        {
          filterCustomFilterFn: 'Custom Filter Fn',
        } as any
      }
    />
  );
};

export default Example;
