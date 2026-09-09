'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, 
  Download, SlidersHorizontal, Check, 
  ChevronLeft, ChevronRight, Loader2, Inbox, 
  X, AlertCircle 
} from 'lucide-react';
import Button from './Button';

/**
 * Reusable NEXIS Enterprise Table Component
 * Supports: Sorting, Filtering, Search, Pagination, Column Visibility,
 * Bulk Row Selection, Bulk Actions, CSV Export, Loading & Empty States.
 */
export default function EnterpriseTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  initialSortKey = '',
  initialSortDir = 'asc',
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  rowKey = 'id',
  selectable = false,
  bulkActions = [], // [{ label, icon, onClick: (selectedRows) => {}, variant: 'danger' }]
  onExport,
  exportFileName = 'Enterprise_Export.csv',
  headerActions = null, // Extra buttons or controls on the top right
  filterComponent = null, // Extra dropdown filters or toggles
  loading = false,
  error = null,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search terms or filters',
  emptyIcon: EmptyIcon = Inbox,
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(initialSortKey || (columns[0]?.key || ''));
  const [sortDir, setSortDir] = useState(initialSortDir);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initial = {};
    columns.forEach(col => {
      initial[col.key] = col.visible !== false;
    });
    return initial;
  });
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);

  // Toggle sort
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filter and search
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase().trim();
    return data.filter(row => {
      const keysToSearch = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key);
      return keysToSearch.some(key => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchKeys, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const isNum = typeof valA === 'number' && typeof valB === 'number';
      let comparison = 0;
      if (isNum) {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  // Bulk Selection Handlers
  const getRowId = (row, index) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey] || index);

  const isAllSelected = paginatedData.length > 0 && paginatedData.every((row, i) => selectedIds.has(getRowId(row, i)));

  const handleToggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllSelected) {
        paginatedData.forEach((row, i) => next.delete(getRowId(row, i)));
      } else {
        paginatedData.forEach((row, i) => next.add(getRowId(row, i)));
      }
      return next;
    });
  };

  const handleToggleRow = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Selected Row Objects
  const selectedRows = useMemo(() => {
    return data.filter((row, i) => selectedIds.has(getRowId(row, i)));
  }, [data, selectedIds]);

  // Default CSV Export
  const handleDefaultExport = () => {
    if (onExport) {
      onExport(sortedData);
      return;
    }
    if (sortedData.length === 0) return;

    const visibleCols = columns.filter(c => columnVisibility[c.key]);
    const headers = visibleCols.map(c => `"${c.header || c.key}"`).join(',');
    const rows = sortedData.map(row => 
      visibleCols.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const visibleColumns = columns.filter(c => columnVisibility[c.key]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search & Custom Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8.5 pr-8 py-1.5 h-9 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {filterComponent}
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Column Visibility Toggler */}
          <div className="relative">
            <Button
              variant="secondary"
              size="md"
              icon={SlidersHorizontal}
              onClick={() => setIsColMenuOpen(!isColMenuOpen)}
              title="Toggle Columns"
            >
              <span className="hidden sm:inline">Columns</span>
            </Button>

            {isColMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsColMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Visible Columns
                  </p>
                  <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                    {columns.map(col => (
                      <label 
                        key={col.key} 
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-slate-700 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={columnVisibility[col.key] !== false}
                          onChange={(e) => setColumnVisibility({ ...columnVisibility, [col.key]: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{col.header || col.key}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <Button
            variant="secondary"
            size="md"
            icon={Download}
            onClick={handleDefaultExport}
            title="Download CSV"
          >
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          {/* User-defined Header Actions (e.g. "Register New SKU") */}
          {headerActions}
        </div>
      </div>

      {/* Bulk Actions Floating Banner */}
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <span>{selectedIds.size} row(s) selected</span>
            <button 
              onClick={clearSelection} 
              className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold ml-2 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || 'secondary'}
                size="sm"
                icon={action.icon}
                onClick={() => action.onClick(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading enterprise records...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600 flex flex-col items-center gap-2">
            <AlertCircle size={32} />
            <p className="font-bold text-sm">Failed to load data</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <EmptyIcon size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700">{emptyTitle}</p>
            <p className="text-xs mt-1 text-slate-500">{emptySubtitle}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider select-none">
                  {selectable && (
                    <th className="py-3 px-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        title="Select all on page"
                      />
                    </th>
                  )}

                  {visibleColumns.map((col) => {
                    const isSorted = sortKey === col.key;
                    const canSort = col.sortable !== false;
                    const alignClass = 
                      col.align === 'right' ? 'text-right' : 
                      col.align === 'center' ? 'text-center' : 'text-left';

                    return (
                      <th
                        key={col.key}
                        onClick={() => canSort && handleSort(col.key)}
                        className={`py-3 px-3.5 ${alignClass} ${col.width || ''} ${
                          canSort ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors' : ''
                        }`}
                      >
                        <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                          <span>{col.header || col.key}</span>
                          {canSort && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDir === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                              ) : (
                                <ArrowUpDown size={11} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((row, index) => {
                  const id = getRowId(row, index);
                  const isSelected = selectedIds.has(id);

                  return (
                    <tr 
                      key={id} 
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {selectable && (
                        <td className="py-3 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                      )}

                      {visibleColumns.map((col) => {
                        const alignClass = 
                          col.align === 'right' ? 'text-right' : 
                          col.align === 'center' ? 'text-center' : 'text-left';

                        return (
                          <td key={col.key} className={`py-3 px-3.5 ${alignClass} text-slate-700`}>
                            {col.render ? col.render(row, index) : row[col.key]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && sortedData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600">
            {/* Range Indicator */}
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="font-bold text-slate-900">{(validCurrentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="font-bold text-slate-900">{Math.min(validCurrentPage * pageSize, totalItems)}</strong> of{' '}
                <strong className="font-bold text-slate-900">{totalItems}</strong> entries
              </span>

              {/* Page size selector */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {pageSizeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                title="Previous page"
              >
                Previous
              </Button>

              <span className="px-3 py-1 font-bold text-slate-700">
                {validCurrentPage} / {totalPages}
              </span>

              <Button
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                title="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
