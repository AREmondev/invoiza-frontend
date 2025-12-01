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
  FilterFn,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Settings,
  Eye,
  EyeOff,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Columns,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Enhanced filter function for better search
const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
  const searchValue = value.toLowerCase();
  const cellValue = row.getValue(columnId);
  
  if (cellValue === null || cellValue === undefined) return false;
  
  // Handle different data types
  if (typeof cellValue === 'string') {
    return cellValue.toLowerCase().includes(searchValue);
  }
  if (typeof cellValue === 'number') {
    return cellValue.toString().includes(searchValue);
  }
  if (cellValue instanceof Date) {
    return cellValue.toLocaleDateString().toLowerCase().includes(searchValue);
  }
  if (typeof cellValue === 'object') {
    return JSON.stringify(cellValue).toLowerCase().includes(searchValue);
  }
  
  return false;
};

interface UnifiedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableId: string;
  userId?: string;
  searchable?: boolean;
  columnVisibility?: boolean;
  pagination?: boolean;
  rowSelection?: boolean;
  actions?: {
    label: string;
    action: (row: TData) => void;
    icon?: React.ReactNode;
  }[];
  enableExport?: boolean;
  exportFormats?: ("csv" | "excel")[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  className?: string;
  enableColumnSearch?: boolean; // Enable individual column search
}

export function UnifiedDataTable<TData, TValue>({
  columns,
  data,
  tableId,
  userId = "default-user",
  searchable = true,
  columnVisibility: enableColumnVisibility = true,
  pagination = true,
  rowSelection: enableRowSelection = false,
  actions = [],
  enableExport = true,
  exportFormats = ["csv", "excel"],
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  onRowClick,
  className,
  enableColumnSearch = true,
}: UnifiedDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnSearch, setColumnSearch] = React.useState<Record<string, string>>({});
  const [showColumnFilters, setShowColumnFilters] = React.useState(false);

  // Load preferences from localStorage
  React.useEffect(() => {
    const storageKey = `unified-table-prefs-${userId}-${tableId}`;
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
        // Page size will be handled in initialState
      } catch (error) {
        console.warn("Failed to load table preferences:", error);
      }
    }
  }, [tableId, userId]);

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
    onRowSelectionChange: enableRowSelection ? setRowSelection : undefined,
    globalFilterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(enableRowSelection && { rowSelection }),
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
  });

  // Save preferences to localStorage
  React.useEffect(() => {
    const storageKey = `unified-table-prefs-${userId}-${tableId}`;
    const preferences = {
      columnVisibility,
      sorting,
      columnFilters,
      pageSize: table.getState().pagination.pageSize,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [columnVisibility, sorting, columnFilters, tableId, userId, table]);

  const handleColumnSearch = (columnId: string, value: string) => {
    setColumnSearch((prev) => ({ ...prev, [columnId]: value }));
    const column = table.getColumn(columnId);
    if (column) {
      column.setFilterValue(value || undefined);
    }
  };

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnSearch({});
    setColumnFilters([]);
    table.resetColumnFilters();
    table.resetGlobalFilter();
  };

  const resetPreferences = () => {
    if (confirm("Reset all table preferences to default?")) {
      setColumnVisibility({});
      setSorting([]);
      setColumnFilters([]);
      setGlobalFilter("");
      setColumnSearch({});
      const storageKey = `unified-table-prefs-${userId}-${tableId}`;
      localStorage.removeItem(storageKey);
      table.resetColumnFilters();
      table.resetGlobalFilter();
      table.resetSorting();
    }
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = table.getVisibleLeafColumns().map((col) => {
      const header = col.columnDef.header;
      return typeof header === 'string' ? header : col.id;
    });
    
    const rows = table.getFilteredRowModel().rows.map((row) =>
      table.getVisibleLeafColumns().map((col) => {
        const value = row.getValue(col.id);
        if (value === null || value === undefined) return "";
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
    );

    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For now, export as CSV which Excel can open
    exportToCSV();
  };

  const activeFiltersCount = columnFilters.length + (globalFilter ? 1 : 0);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="pl-8"
              />
            </div>
          )}

          {enableColumnSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnFilters(!showColumnFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Column Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Row Selection Info */}
          {enableRowSelection && Object.keys(rowSelection).length > 0 && (
            <Badge variant="default">
              {Object.keys(rowSelection).length} selected
            </Badge>
          )}

          {/* Export Menu */}
          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {exportFormats.includes("csv") && (
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as CSV
                  </DropdownMenuItem>
                )}
                {exportFormats.includes("excel") && (
                  <DropdownMenuItem onClick={exportToExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Export as Excel
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility Toggle */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns className="h-4 w-4 mr-2" />
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
                    const header = column.columnDef.header;
                    const headerText = typeof header === 'string' ? header : column.id;
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {headerText}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetPreferences}>
                  <Settings className="mr-2 h-4 w-4" />
                  Reset Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Actions Menu */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action) => {
                  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
                  return (
                    <DropdownMenuItem
                      key={action.label}
                      onClick={() => {
                        if (selectedRows.length > 0) {
                          selectedRows.forEach(row => action.action(row));
                        }
                      }}
                      disabled={selectedRows.length === 0}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Column Filters Panel */}
      {enableColumnSearch && showColumnFilters && (
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Column Filters</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowColumnFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {table
              .getAllColumns()
              .filter((column) => column.getCanFilter() && column.getIsVisible())
              .map((column) => {
                const header = column.columnDef.header;
                const headerText = typeof header === 'string' ? header : column.id;
                return (
                  <div key={column.id} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {headerText}
                    </label>
                    <Input
                      placeholder={`Filter ${headerText}...`}
                      value={columnSearch[column.id] ?? ""}
                      onChange={(event) =>
                        handleColumnSearch(column.id, event.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={table.getIsAllPageRowsSelected()}
                      onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                      }
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="relative">
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center space-x-2",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none hover:text-primary"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
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
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    row.getIsSelected() && "bg-muted"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {enableRowSelection && (
                    <TableCell className="w-12">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
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
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm text-muted-foreground">No results found.</p>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" onClick={clearAllFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Controls */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Rows per page</p>
            <select
              className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {table.getRowCount()} row(s)
          </div>
        </div>
      )}
    </div>
  );
}

