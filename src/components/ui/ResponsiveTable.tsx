import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { SkeletonTable } from './LoadingIndicator';
import EmptyState from './EmptyState';

/**
 * ResponsiveTable Component
 *
 * A table that automatically switches to card layout on mobile devices.
 * Includes pagination info, sorting, and accessibility features.
 *
 * Features:
 * - Responsive design (table on desktop, cards on mobile)
 * - Pagination with "Showing X of Y" info
 * - Sortable columns
 * - Loading and empty states
 * - Accessible with proper ARIA attributes
 * - Bulk selection support
 */

export interface TableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Cell renderer function */
  render: (item: T, index: number) => React.ReactNode;
  /** Mobile card renderer (if different from table cell) */
  mobileRender?: (item: T, index: number) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Hide on mobile cards */
  hideOnMobile?: boolean;
  /** Use as primary field on mobile card */
  isPrimary?: boolean;
  /** Use as secondary field on mobile card */
  isSecondary?: boolean;
  /** Align content */
  align?: 'left' | 'center' | 'right';
}

export interface ResponsiveTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Unique key extractor */
  keyExtractor: (item: T) => string | number;
  /** Loading state */
  loading?: boolean;
  /** Current page (0-indexed) */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Total elements (for pagination) */
  totalElements?: number;
  /** Total pages (alternative to totalElements) */
  totalPages?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Sort change handler */
  onSortChange?: (sortKey: string, direction: 'asc' | 'desc') => void;
  /** Current sort key */
  sortKey?: string;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: (string | number)[];
  /** Selection change handler */
  onSelectionChange?: (keys: (string | number)[]) => void;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Empty state props */
  emptyState?: {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  /** Mobile breakpoint (default 768) */
  mobileBreakpoint?: number;
  /** Additional className */
  className?: string;
  /** Striped rows */
  striped?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
  /** Compact mode */
  compact?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  page = 0,
  pageSize = 20,
  totalElements,
  totalPages,
  onPageChange,
  onSortChange,
  sortKey,
  sortDirection,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  emptyState,
  mobileBreakpoint = 768,
  className = '',
  striped = true,
  hoverable = true,
  compact = false,
}: ResponsiveTableProps<T>) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false
  );

  // Listen for resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileBreakpoint]);

  // Calculate pagination info
  const totalElementsCalc = totalElements ?? (totalPages ? totalPages * pageSize : data.length);
  const totalPagesCalc = totalPages ?? Math.ceil(totalElementsCalc / pageSize);
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElementsCalc);

  // Selection handlers
  const isAllSelected = useMemo(
    () => data.length > 0 && data.every(item => selectedKeys.includes(keyExtractor(item))),
    [data, selectedKeys, keyExtractor]
  );

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(data.map(item => keyExtractor(item)));
    }
  };

  const handleSelectRow = (key: string | number) => {
    if (selectedKeys.includes(key)) {
      onSelectionChange?.(selectedKeys.filter(k => k !== key));
    } else {
      onSelectionChange?.([...selectedKeys, key]);
    }
  };

  // Sort handler
  const handleSort = (key: string) => {
    if (!onSortChange) return;
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(key, newDirection);
  };

  // Render sort icon
  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    if (sortKey !== column.key) {
      return <ArrowUpDown size={14} style={{ opacity: 0.4 }} />;
    }
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // Loading state
  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length} />;
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        variant="no-data"
        title={emptyState?.title || 'No data found'}
        description={emptyState?.description}
        action={emptyState?.onAction ? {
          label: emptyState.actionLabel || 'Create new',
          onClick: emptyState.onAction,
        } : undefined}
      />
    );
  }

  // Styles
  const tableWrapperStyles: React.CSSProperties = {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid var(--admin-border, #E2E8F0)',
    background: 'var(--admin-bg-primary, #FFFFFF)',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: compact ? '0.8125rem' : '0.875rem',
  };

  const thStyles: React.CSSProperties = {
    padding: compact ? '10px 12px' : '14px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--admin-primary, #1E293B)',
    background: 'var(--admin-bg-secondary, #F8FAFC)',
    borderBottom: '1px solid var(--admin-border, #E2E8F0)',
    whiteSpace: 'nowrap',
  };

  const tdStyles: React.CSSProperties = {
    padding: compact ? '10px 12px' : '14px 16px',
    borderBottom: '1px solid var(--admin-border, #E2E8F0)',
    color: 'var(--admin-primary, #1E293B)',
  };

  const sortButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    fontWeight: 600,
    color: 'inherit',
    cursor: 'pointer',
  };

  // Pagination styles
  const paginationStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderTop: '1px solid var(--admin-border, #E2E8F0)',
    background: 'var(--admin-bg-secondary, #F8FAFC)',
    flexWrap: 'wrap',
    gap: '12px',
  };

  const paginationInfoStyles: React.CSSProperties = {
    fontSize: '0.8125rem',
    color: 'var(--admin-secondary, #64748B)',
  };

  const paginationButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--admin-border, #E2E8F0)',
    background: 'var(--admin-bg-primary, #FFFFFF)',
    color: 'var(--admin-primary, #1E293B)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const paginationButtonDisabledStyles: React.CSSProperties = {
    ...paginationButtonStyles,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  // Mobile card styles
  const mobileCardStyles: React.CSSProperties = {
    background: 'var(--admin-bg-primary, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E8F0)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
  };

  const mobileFieldStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: '1px solid var(--admin-border, #E2E8F0)',
  };

  const mobileFieldLabelStyles: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--admin-secondary, #64748B)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const mobileFieldValueStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--admin-primary, #1E293B)',
    textAlign: 'right',
    flex: 1,
    marginLeft: '16px',
  };

  // Render mobile cards
  if (isMobile) {
    const primaryColumn = columns.find(c => c.isPrimary);
    const secondaryColumn = columns.find(c => c.isSecondary);
    const otherColumns = columns.filter(c => !c.hideOnMobile && !c.isPrimary && !c.isSecondary);

    return (
      <div className={`responsive-table responsive-table--mobile ${className}`}>
        {data.map((item, index) => {
          const key = keyExtractor(item);
          const isSelected = selectedKeys.includes(key);

          return (
            <div
              key={key}
              style={{
                ...mobileCardStyles,
                ...(isSelected && { borderColor: 'var(--admin-accent, #F6C845)' }),
              }}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
            >
              {/* Primary field (card title) */}
              {primaryColumn && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--admin-primary)' }}>
                    {primaryColumn.mobileRender
                      ? primaryColumn.mobileRender(item, index)
                      : primaryColumn.render(item, index)}
                  </div>
                  {secondaryColumn && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--admin-secondary)', marginTop: '4px' }}>
                      {secondaryColumn.mobileRender
                        ? secondaryColumn.mobileRender(item, index)
                        : secondaryColumn.render(item, index)}
                    </div>
                  )}
                </div>
              )}

              {/* Other fields */}
              {otherColumns.map(column => (
                <div key={column.key} style={mobileFieldStyles}>
                  <span style={mobileFieldLabelStyles}>{column.header}</span>
                  <span style={mobileFieldValueStyles}>
                    {column.mobileRender
                      ? column.mobileRender(item, index)
                      : column.render(item, index)}
                  </span>
                </div>
              ))}

              {/* Selection checkbox */}
              {selectable && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--admin-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(key)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--admin-secondary)' }}>Select</span>
                  </label>
                </div>
              )}
            </div>
          );
        })}

        {/* Pagination */}
        {onPageChange && totalPagesCalc > 1 && (
          <div style={paginationStyles}>
            <span style={paginationInfoStyles}>
              Showing {startItem} to {endItem} of {totalElementsCalc}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                style={page === 0 ? paginationButtonDisabledStyles : paginationButtonStyles}
                onClick={() => onPageChange(0)}
                disabled={page === 0}
                aria-label="First page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                style={page === 0 ? paginationButtonDisabledStyles : paginationButtonStyles}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                {page + 1} / {totalPagesCalc}
              </span>
              <button
                style={page >= totalPagesCalc - 1 ? paginationButtonDisabledStyles : paginationButtonStyles}
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPagesCalc - 1}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
              <button
                style={page >= totalPagesCalc - 1 ? paginationButtonDisabledStyles : paginationButtonStyles}
                onClick={() => onPageChange(totalPagesCalc - 1)}
                disabled={page >= totalPagesCalc - 1}
                aria-label="Last page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render desktop table
  return (
    <div className={`responsive-table responsive-table--desktop ${className}`} style={tableWrapperStyles}>
      <table style={tableStyles} role="table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ ...thStyles, width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.key}
                style={{
                  ...thStyles,
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
              >
                {column.sortable ? (
                  <button
                    style={sortButtonStyles}
                    onClick={() => handleSort(column.key)}
                    aria-label={`Sort by ${column.header}`}
                  >
                    {column.header}
                    {renderSortIcon(column)}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const key = keyExtractor(item);
            const isSelected = selectedKeys.includes(key);

            return (
              <tr
                key={key}
                style={{
                  backgroundColor: striped && index % 2 === 1
                    ? 'var(--admin-bg-secondary, #F8FAFC)'
                    : 'transparent',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
                onClick={() => onRowClick?.(item)}
                onMouseEnter={e => {
                  if (hoverable) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(246, 200, 69, 0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (hoverable) {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      striped && index % 2 === 1 ? 'var(--admin-bg-secondary, #F8FAFC)' : 'transparent';
                  }
                }}
              >
                {selectable && (
                  <td style={{ ...tdStyles, width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(key)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td
                    key={column.key}
                    style={{
                      ...tdStyles,
                      textAlign: column.align || 'left',
                    }}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      {onPageChange && totalPagesCalc > 1 && (
        <div style={paginationStyles}>
          <span style={paginationInfoStyles}>
            Showing {startItem} to {endItem} of {totalElementsCalc} items
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              style={page === 0 ? paginationButtonDisabledStyles : paginationButtonStyles}
              onClick={() => onPageChange(0)}
              disabled={page === 0}
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              style={page === 0 ? paginationButtonDisabledStyles : paginationButtonStyles}
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '0 16px', fontSize: '0.875rem', color: 'var(--admin-primary)' }}>
              Page {page + 1} of {totalPagesCalc}
            </span>
            <button
              style={page >= totalPagesCalc - 1 ? paginationButtonDisabledStyles : paginationButtonStyles}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPagesCalc - 1}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              style={page >= totalPagesCalc - 1 ? paginationButtonDisabledStyles : paginationButtonStyles}
              onClick={() => onPageChange(totalPagesCalc - 1)}
              disabled={page >= totalPagesCalc - 1}
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponsiveTable;
