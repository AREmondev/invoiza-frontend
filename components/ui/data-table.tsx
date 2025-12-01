"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableId: string;
  userId: string;
  searchable?: boolean;
  columnVisibility?: boolean;
  pagination?: boolean;
  rowSelection?: boolean;
  actions?: {
    label: string;
    action: (row: TData) => void;
    icon?: React.ReactNode;
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableId,
  userId,
  searchable = true,
  columnVisibility: enableColumnVisibility = true,
  pagination = true,
  rowSelection: enableRowSelection = false,
  actions = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnSearch, setColumnSearch] = React.useState<
    Record<string, string>
  >({});

  // Load preferences from localStorage
  React.useEffect(() => {
    const storageKey = `table-preferences-${userId}-${tableId}`;
    const savedPreferences = localStorage.getItem(storageKey);

    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.columnVisibility) {
          setColumnVisibility(preferences.columnVisibility);
        }
        if (preferences.sorting) {
          setSorting(preferences.sorting);
        }
        if (preferences.columnFilters) {
          setColumnFilters(preferences.columnFilters);
        }
      } catch (error) {
        console.warn("Failed to load table preferences:", error);
      }
    }
  }, [tableId, userId]);

  // Save preferences to localStorage
  React.useEffect(() => {
    const storageKey = `table-preferences-${userId}-${tableId}`;
    const preferences = {
      columnVisibility,
      sorting,
      columnFilters,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [columnVisibility, sorting, columnFilters, tableId, userId]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    ...(enableRowSelection && {
      onRowSelectionChange: setRowSelection,
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        globalFilter,
      },
    }),
    ...(!enableRowSelection && {
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        globalFilter,
      },
    }),
  });

  const handleColumnSearch = (columnId: string, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [columnId]: value }));
    table.getColumn(columnId)?.setFilterValue(value);
  };

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnSearch({});
    setColumnFilters([]);
    table.resetColumnFilters();
  };

  const resetPreferences = () => {
    setColumnVisibility({});
    setSorting([]);
    setColumnFilters([]);
    setGlobalFilter("");
    setColumnSearch({});
    const storageKey = `table-preferences-${userId}-${tableId}`;
    localStorage.removeItem(storageKey);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetPreferences}>
                  <Settings className="mr-2 h-4 w-4" />
                  Reset All Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Filter Controls */}
          {(columnFilters.length > 0 || globalFilter) && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear Filters
              <Badge variant="secondary" className="ml-2">
                {columnFilters.length + (globalFilter ? 1 : 0)}
              </Badge>
            </Button>
          )}

          {/* Row Selection Info */}
          {enableRowSelection && Object.keys(rowSelection).length > 0 && (
            <Badge variant="default">
              {Object.keys(rowSelection).length} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Column Filters */}
      {columnFilters.length > 0 && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Column Filters</h4>
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
          <div className="grid gap-3">
            {table
              .getAllColumns()
              .filter(
                (column) => column.getIsVisible() && column.getCanFilter()
              )
              .map((column) => (
                <div key={column.id} className="flex items-center gap-2">
                  <label className="text-sm font-medium min-w-[100px]">
                    {column.id}:
                  </label>
                  <Input
                    placeholder={`Filter ${column.id}...`}
                    value={columnSearch[column.id] ?? ""}
                    onChange={(event) =>
                      handleColumnSearch(column.id, event.target.value)
                    }
                    className="max-w-xs"
                  />
                  {columnSearch[column.id] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleColumnSearch(column.id, "")}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between">
        {pagination && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">Show:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {table.getRowCount()}{" "}
          row(s) filtered.
        </div>
      </div>
    </div>
  );
}