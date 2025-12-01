"use client";

import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type GroupingState,
} from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Columns } from "lucide-react";

export type DataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  pageSizeOptions?: number[];
  enableRowSelection?: boolean;
  height?: number; // for virtualization
  tableId?: string; // Unique ID for saving preferences
  enablePreferences?: boolean; // Enable saving preferences to localStorage
};

export function DataTable<TData>({ 
  data, 
  columns, 
  pageSizeOptions = [10, 20, 50], 
  enableRowSelection = true, 
  height = 420,
  tableId = 'default-table',
  enablePreferences = true,
}: DataTableProps<TData>) {
  // Load preferences from localStorage
  const loadPreferences = React.useCallback(() => {
    if (!enablePreferences) return {};
    
    try {
      const stored = localStorage.getItem(`datatable-prefs-${tableId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading table preferences:', error);
    }
    return {};
  }, [tableId, enablePreferences]);

  // Save preferences to localStorage
  const savePreferences = React.useCallback((prefs: any) => {
    if (!enablePreferences) return;
    
    try {
      localStorage.setItem(`datatable-prefs-${tableId}`, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving table preferences:', error);
    }
  }, [tableId, enablePreferences]);

  const initialPrefs = React.useMemo(() => loadPreferences(), [loadPreferences]);
  
  const [globalFilter, setGlobalFilter] = React.useState(initialPrefs.globalFilter || "");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialPrefs.columnFilters || []);
  const [sorting, setSorting] = React.useState<SortingState>(initialPrefs.sorting || []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialPrefs.columnVisibility || {});
  const [rowSelection, setRowSelection] = React.useState({});
  const [grouping, setGrouping] = React.useState<GroupingState>(initialPrefs.grouping || []);
  const [pageSize, setPageSize] = React.useState(initialPrefs.pageSize || pageSizeOptions[0]);

  // Save preferences when they change
  React.useEffect(() => {
    if (enablePreferences) {
      savePreferences({
        globalFilter,
        columnFilters,
        sorting,
        columnVisibility,
        grouping,
        pageSize,
      });
    }
  }, [globalFilter, columnFilters, sorting, columnVisibility, grouping, pageSize, enablePreferences, savePreferences]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      rowSelection,
      grouping,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    enableRowSelection,
  });

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // row height
    overscan: 8,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <Input
          className="max-w-xs"
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><Columns className="h-4 w-4" /> Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
              >
                {column.columnDef.header && typeof column.columnDef.header === "function"
                  ? column.id
                  : (column.columnDef.header as any) ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><ChevronDown className="h-4 w-4" /> Grouping</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Group By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={table.getState().grouping?.includes(column.id) ?? false}
                onCheckedChange={(checked) =>
                  table.setGrouping(
                    checked
                      ? [...table.getState().grouping, column.id]
                      : table.getState().grouping.filter((c) => c !== column.id)
                  )
                }
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              const newPageSize = Number(v);
              setPageSize(newPageSize);
              table.setPageSize(newPageSize);
            }}
          >
            <SelectTrigger className="w-[110px]"><SelectValue placeholder="Page size" /></SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>{size} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => {
            table.resetColumnFilters();
            setColumnFilters([]);
          }}>Clear Filters</Button>
          <Button variant="outline" size="sm" onClick={() => {
            table.setGrouping([]);
            setGrouping([]);
          }}>Clear Grouping</Button>
          {enablePreferences && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (confirm('Reset all table preferences to default?')) {
                  localStorage.removeItem(`datatable-prefs-${tableId}`);
                  window.location.reload();
                }
              }}
            >
              Reset Preferences
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection && (
                  <TableHead>
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2 select-none">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="shrink-0 w-px h-6 bg-muted-foreground/50 cursor-col-resize"
                          />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
            {/* Column filter inputs */}
            <TableRow>
              {enableRowSelection && <TableHead />}
              {table.getAllLeafColumns().map((column) => (
                <TableHead key={column.id}>
                  {column.getCanFilter() ? (
                    <Input
                      placeholder={`Filter ${column.id}`}
                      value={(column.getFilterValue() as string) ?? ""}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>

        {/* Virtualized body */}
        <div ref={parentRef} style={{ height, overflow: "auto" }}>
          <Table>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {enableRowSelection && (
                    <TableCell>
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(!!v)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>
        <div className="text-sm">
          Selected: {Object.keys(table.getState().rowSelection).length}
        </div>
      </div>
    </div>
  );
}