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
  getGroupedRowModel,
  getExpandedRowModel,
  useReactTable,
  FilterFn,
  SortingFn,
  Column,
  Row,
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
  Plus,
  Minus,
  FileSpreadsheet,
  FileText,
  FileDown,
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Advanced filter types
export type FilterType = 
  | "text"
  | "number"
  | "date"
  | "select"
  | "multi-select"
  | "range"
  | "boolean";

export interface ColumnFilterConfig {
  type: FilterType;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export type AdvancedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  filterConfig?: ColumnFilterConfig;
  enableGrouping?: boolean;
  enableAggregating?: boolean;
  aggregationFn?: "sum" | "avg" | "count" | "min" | "max" | "unique";
};

interface DataTableProps<TData, TValue> {
  columns: AdvancedColumnDef<TData, TValue>[];
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
  enableGrouping?: boolean;
  enableAggregating?: boolean;
  enableExport?: boolean;
  exportFormats?: ("csv" | "excel" | "pdf")[];
  enableAdvancedFilters?: boolean;
  enableMultiSort?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  className?: string;
}

// Custom filter functions
const customFilterFns: Record<string, FilterFn<any>> = {
  dateRange: (row: Row<any>, columnId: string, filterValue: [Date, Date]) => {
    const rowValue = row.getValue(columnId) as Date;
    const [start, end] = filterValue;
    return rowValue >= start && rowValue <= end;
  },
  numberRange: (row: Row<any>, columnId: string, filterValue: [number, number]) => {
    const rowValue = row.getValue(columnId) as number;
    const [min, max] = filterValue;
    return rowValue >= min && rowValue <= max;
  },
  multiSelect: (row: Row<any>, columnId: string, filterValue: string[]) => {
    const rowValue = row.getValue(columnId) as string;
    return filterValue.length === 0 || filterValue.includes(rowValue);
  },
};

// Advanced filter component
function ColumnFilter<TData>({
  column,
}: {
  column: Column<TData, unknown>;
}) {
  const columnFilterValue = column.getFilterValue();
  const filterConfig = (column.columnDef as AdvancedColumnDef<TData, unknown>).filterConfig;
  
  if (!filterConfig) return null;

  const { type, options, min, max, placeholder } = filterConfig;

  const handleFilterChange = (value: any) => {
    column.setFilterValue(value);
  };

  const clearFilter = () => {
    column.setFilterValue(undefined);
  };

  switch (type) {
    case "text":
      return (
        <div className="relative">
          <Input
            type="text"
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => handleFilterChange(e.target.value)}
            placeholder={placeholder || "Filter..."}
            className="h-8 w-full text-sm"
          />
          {columnFilterValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-8 w-8 p-0"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );

    case "number":
      return (
        <div className="relative">
          <Input
            type="number"
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => handleFilterChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={placeholder || "Filter..."}
            className="h-8 w-full text-sm"
            min={min}
            max={max}
          />
          {columnFilterValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-8 w-8 p-0"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );

    case "date":
      return (
        <div className="relative">
          <Input
            type="date"
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="h-8 w-full text-sm"
          />
          {columnFilterValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-8 w-8 p-0"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );

    case "select":
      return (
        <div className="relative">
          <select
            value={(columnFilterValue ?? "") as string}
            onChange={(e) => handleFilterChange(e.target.value || undefined)}
            className="h-8 w-full text-sm border border-input rounded-md bg-background px-3 py-1"
          >
            <option value="">All</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {columnFilterValue && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-8 w-8 p-0"
              onClick={clearFilter}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      );

    case "multi-select":
      return (
        <div className="space-y-2">
          <div className="max-h-32 overflow-y-auto border rounded-md p-2">
            {options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={((columnFilterValue as string[]) ?? []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = (columnFilterValue as string[]) ?? [];
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v) => v !== option.value);
                    handleFilterChange(newValues.length > 0 ? newValues : undefined);
                  }}
                  className="rounded border-gray-300"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          {(columnFilterValue as string[])?.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={clearFilter}
            >
              Clear
            </Button>
          )}
        </div>
      );

    case "range":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={((columnFilterValue as [number, number])?.[0] ?? "") as string}
              onChange={(e) => {
                const currentRange = (columnFilterValue as [number, number]) ?? [undefined, undefined];
                handleFilterChange([e.target.value ? Number(e.target.value) : undefined, currentRange[1]]);
              }}
              className="h-8 w-full text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={((columnFilterValue as [number, number])?.[1] ?? "") as string}
              onChange={(e) => {
                const currentRange = (columnFilterValue as [number, number]) ?? [undefined, undefined];
                handleFilterChange([currentRange[0], e.target.value ? Number(e.target.value) : undefined]);
              }}
              className="h-8 w-full text-sm"
            />
          </div>
          {(columnFilterValue as [number, number])?.some(v => v !== undefined) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={clearFilter}
            >
              Clear
            </Button>
          )}
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={(columnFilterValue as boolean) ?? false}
            onChange={(e) => handleFilterChange(e.target.checked || undefined)}
            className="rounded border-gray-300"
          />
          <Label className="text-sm">{placeholder || "Filter"}</Label>
          {columnFilterValue !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={clearFilter}
            >
              Clear
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}

// Export functionality
function ExportMenu<TData>({
  table,
  formats = ["csv", "excel"],
  filename = "export",
}: {
  table: any;
  formats: ("csv" | "excel" | "pdf")[];
  filename?: string;
}) {
  const exportToCSV = () => {
    const headers = table.getVisibleLeafColumns().map((col: any) => col.columnDef.header);
    const data = table.getFilteredRowModel().rows.map((row: any) =>
      table.getVisibleLeafColumns().map((col: any) => {
        const value = row.getValue(col.columnDef.accessorKey);
        return value ?? "";
      })
    );

    const csvContent = [
      headers.join(","),
      ...data.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // Simple Excel export (could use a library like xlsx for more advanced features)
    exportToCSV(); // For now, export as CSV which Excel can open
  };

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Export Data</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {formats.includes("csv") && (
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      )}
      {formats.includes("excel") && (
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  tableId,
  userId,
  searchable = true,
  columnVisibility: enableColumnVisibility = true,
  pagination = true,
  rowSelection: enableRowSelection = false,
  actions = [],
  enableGrouping = false,
  enableAggregating = false,
  enableExport = true,
  exportFormats = ["csv", "excel"],
  enableAdvancedFilters = true,
  enableMultiSort = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  onRowClick,
  onSelectionChange,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [grouping, setGrouping] = React.useState<string[]>([]);
  const [expanded, setExpanded] = React.useState({});
  const [showFilters, setShowFilters] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

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
        if (preferences.grouping && enableGrouping) {
          setGrouping(preferences.grouping);
        }
      } catch (error) {
        console.warn("Failed to load table preferences:", error);
      }
    }
    // Mark initial load as complete after a short delay to allow state to settle
    const timeoutId = setTimeout(() => setIsInitialLoad(false), 100);
    
    // Cleanup: cancel timeout if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [tableId, userId, enableGrouping]);

  // Save preferences to localStorage (skip during initial load)
  React.useEffect(() => {
    if (isInitialLoad) return;
    
    const storageKey = `table-preferences-${userId}-${tableId}`;
    const preferences = {
      columnVisibility,
      sorting,
      columnFilters,
      grouping,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [columnVisibility, sorting, columnFilters, grouping, tableId, userId, isInitialLoad]);

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
    }),
    ...(enableGrouping && {
      onGroupingChange: setGrouping,
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    }),
    ...(enableMultiSort && {
      enableMultiSort: true,
      isMultiSortEvent: () => true,
    }),
    filterFns: customFilterFns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      ...(enableRowSelection && { rowSelection }),
      ...(enableGrouping && { grouping, expanded }),
      globalFilter,
    },
  });

  // Handle selection change
  React.useEffect(() => {
    if (onSelectionChange && enableRowSelection) {
      const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, enableRowSelection, table]);

  const clearAllFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchable && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="pl-8"
              />
            </div>
          )}
          
          {enableAdvancedFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {columnFilters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {columnFilters.length}
                </Badge>
              )}
            </Button>
          )}

          {columnFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
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
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <ExportMenu table={table} formats={exportFormats} filename={tableId} />
            </DropdownMenu>
          )}

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
                        {column.columnDef.header?.toString()}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Actions Menu */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    onClick={() => {
                      const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
                      selectedRows.forEach(row => action.action(row));
                    }}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {enableAdvancedFilters && showFilters && (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {table.getAllColumns().map((column) => {
              const filterConfig = (column.columnDef as AdvancedColumnDef<TData, TValue>).filterConfig;
              if (!filterConfig) return null;
              
              return (
                <div key={column.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {column.columnDef.header?.toString()}
                  </Label>
                  <ColumnFilter column={column} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="relative">
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder ? null : (
                          <>
                            {enableGrouping && header.column.getCanGroup() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={header.column.getToggleGroupingHandler()}
                              >
                                {header.column.getIsGrouped() ? (
                                  <Minus className="h-3 w-3" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                            <div
                              className={cn(
                                "flex items-center space-x-2 cursor-pointer select-none",
                                header.column.getCanSort() && "hover:bg-muted rounded"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <ArrowUpDown className="h-4 w-4" />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Column Filter */}
                      {enableAdvancedFilters && header.column.getCanFilter() && (
                        <div className="mt-2">
                          <ColumnFilter column={header.column} />
                        </div>
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
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    row.getIsGrouped() && "bg-muted/30"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.getIsGrouped() ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              row.getToggleExpandedHandler();
                            }}
                          >
                            {row.getIsExpanded() ? (
                              <Minus className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                          <span className="font-medium">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {row.subRows?.length || 0}
                          </Badge>
                        </div>
                      ) : cell.getIsAggregated() ? (
                        <span className="font-medium text-muted-foreground">
                          {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      ) : cell.getIsPlaceholder() ? null : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                className="h-8 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm"
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
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}