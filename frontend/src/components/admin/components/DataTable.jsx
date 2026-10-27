import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useDensity } from './Density';

/**
 * The admin data table: sticky sortable header, a highlightable row cursor
 * (driven by the section's J/K handler), optional row selection with a bulk
 * bar, optional single-row expansion, UI-density compaction, and pagination.
 * Sort/filter/search stay owned by the section (usually backed by the URL);
 * this component only renders and scrolls.
 *
 * columns: [{ key, label, sortKey?, align?, head?, cellClass?, className?, cell(row)? }]
 *   className applies to the th (e.g. widths), cellClass to each td.
 * sort: [colKey, 'asc'|'desc'] | null; onSort(colKey) toggles in the section.
 * selected/onSelected: controlled Set of rowKey values (both required for selection).
 * cursor/onCursor: highlight + scroll target row index, owned by the section.
 */
export default function DataTable({
  name = 'list',
  columns,
  rows,
  rowKey = (r) => r.id,
  sort, onSort,
  selectable = false, selected, onSelected,
  onRowClick,
  cursor = 0, onCursor,
  rowClass,
  expanded, renderExpanded,
  empty,
  page, onPage, // controlled pageIndex (1-based); internal state otherwise
  pageSize = 50,
  total, // "showing X of N" footer when rows are a pre-paged slice
  bulk, // render-prop (selectedRows, clearSelection) => node
  className,
}) {
  const [density] = useDensity();
  const compact = density === 'compact';
  const [pageSelf, setPageSelf] = useState(1);
  const selectAllRef = useRef(null);
  const bodyRef = useRef(null);

  const pageIndex = Math.max(1, page ?? pageSelf);
  const setPageIndex = (p) => (onPage ? onPage(p) : setPageSelf(p));

  // serverMode: rows are the current slice already; `total` drives page count.
  const serverMode = total !== undefined && onPage;
  const pages = serverMode
    ? Math.max(1, Math.ceil((total || rows.length) / pageSize))
    : Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = !serverMode && pages > 1
    ? rows.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
    : rows;
  const showing = serverMode ? `showing ${slice.length} of ${total}` : null;

  const selection = selectable ? selected : null;
  const selectedRows = useMemo(
    () => (selectable && selection ? slice.filter((r) => selection.has(rowKey(r))) : []),
    [selectable, selection, slice, rowKey],
  );

  const toggleSelect = (r) => {
    if (!selectable || !onSelected) return;
    const next = new Set(selection || []);
    const k = rowKey(r);
    if (next.has(k)) next.delete(k); else next.add(k);
    onSelected(next);
  };
  const allOnPage = slice.length > 0 && slice.every((r) => selection?.has(rowKey(r)));
  const toggleAll = () => {
    if (!selectable || !onSelected) return;
    const next = new Set(selection || []);
    if (allOnPage) slice.forEach((r) => next.delete(rowKey(r)));
    else slice.forEach((r) => next.add(rowKey(r)));
    onSelected(next);
  };

  // Keep the highlighted row visible and report cursor changes upward.
  const lastCursor = useRef(-1);
  useEffect(() => {
    if (cursor === lastCursor.current) return;
    lastCursor.current = cursor;
    const tr = bodyRef.current?.querySelector(`tr[data-ri="${cursor}"]`);
    tr?.scrollIntoView({ block: 'nearest' });
    onCursor?.(cursor);
  }, [cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clamp when the slice shrinks (page turn, filter change).
  useEffect(() => {
    if (cursor > slice.length - 1) onCursor?.(Math.max(0, slice.length - 1));
  }, [slice, cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  const cellPad = compact ? 'px-3 py-2' : 'px-3 py-2.5';
  const cursorBar = 'shadow-[inset_3px_0_0_0_rgba(243,198,83,0.5)]';

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/10 bg-akg-surface', className)}>
      <div
        role="grid"
        aria-label={name}
        tabIndex={0}
        className="max-[1100px]:overflow-x-auto"
      >
        <table className="w-full min-w-[860px] xl:min-w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {selectable && (
                <th className={cn('w-9 bg-[#0A0D13] pl-3', cellPad)}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allOnPage}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded accent-[#F3C653]"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'sticky top-0 z-10 bg-[#0A0D13]',
                    cellPad,
                    'text-left font-data text-[10px] font-bold uppercase tracking-[0.12em] text-akg-muted',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    c.className,
                  )}
                >
                  {c.sortKey && onSort ? (
                    <button
                      onClick={() => onSort(c.key)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-white',
                        sort && sort[0] === c.key && 'text-akg-gold',
                      )}
                    >
                      {c.label}
                      {sort && sort[0] === c.key
                        ? (sort[1] === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)
                        : <ChevronUp className="h-3 w-3 opacity-0 transition-opacity hover:opacity-60" />}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {slice.map((r, i) => {
              const k = rowKey(r);
              const isCursor = i === cursor;
              const first = selectable ? 1 : 0;
              return (
                <React.Fragment key={k}>
                  <tr
                    data-ri={i}
                    className={cn(
                      'border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]',
                      isCursor && 'bg-[#F3C653]/[0.05]',
                      rowClass?.(r) || '',
                    )}
                  >
                    {selectable && (
                      <td className={cn(cellPad, 'pl-3 align-middle', isCursor && cursorBar)}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${i + 1}`}
                          checked={!!selection?.has(k)}
                          onChange={() => toggleSelect(r)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 rounded accent-[#F3C653]"
                        />
                      </td>
                    )}
                    {columns.map((c, j) => (
                      <td
                        key={c.key}
                        className={cn(
                          cellPad,
                          'align-middle text-xs text-akg-silver',
                          c.align === 'right' && 'text-right',
                          c.align === 'center' && 'text-center',
                          c.cellClass,
                          isCursor && j === first && !selectable && cursorBar,
                        )}
                        onClick={onRowClick ? () => onRowClick(r) : undefined}
                      >
                        {c.cell ? c.cell(r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                  {expanded === k && renderExpanded && (
                    <tr>
                      <td colSpan={columns.length + (selectable ? 1 : 0)} className="bg-black/25 px-4 py-3">
                        {renderExpanded(r)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {slice.length === 0 && empty}
      </div>

      {bulk && selectedRows.length > 0 && (
        <div className="sticky bottom-2 z-20 mx-2 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#F3C653]/25 bg-[#151209] px-3 py-2 shadow-lg">
          <span className="font-data text-xs font-bold text-akg-gold">{selectedRows.length} selected</span>
          {bulk(selectedRows, () => onSelected(new Set()))}
          <button
            onClick={() => onSelected(new Set())}
            className="ml-auto text-[11px] font-semibold text-akg-muted hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {(pages > 1 || total !== undefined) && (
        <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2">
          <span className="font-data text-[10px] text-akg-muted">
            {showing || `page ${pageIndex} / ${pages}`}
          </span>
          {(pages > 1 || serverMode) && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                disabled={pageIndex <= 1}
                className="rounded-lg border border-white/10 p-1 text-akg-muted disabled:opacity-30 hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {serverMode && (
                <span className="px-1 font-data text-[10px] text-akg-muted">
                  {pageIndex} / {pages}
                </span>
              )}
              <button
                onClick={() => setPageIndex(Math.min(pages, pageIndex + 1))}
                disabled={pageIndex >= pages}
                className="rounded-lg border border-white/10 p-1 text-akg-muted disabled:opacity-30 hover:text-white"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
