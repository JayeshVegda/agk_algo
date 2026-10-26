import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useDensity } from './Density';

/**
 * The admin data table: sticky sortable header, J/K row cursor with Enter to
 * open, optional row selection with a bulk bar, optional single-row
 * expansion, UI-density compaction, and pagination. Sort/filter/search stay
 * owned by the section (usually backed by the URL); this component only
 * renders and navigates.
 *
 * columns: [{ key, label, sortKey?, align?, head?, cellClass?, className?, cell(row)? }]
 *   className applies to the th (e.g. widths), cellClass to each td.
 * sort: [colKey, 'asc'|'desc'] | null; onSort(colKey) toggles in the section.
 * selected/onSelected: controlled Set of rowKey values (both required for selection).
 */
export default function DataTable({
  name = 'list',
  columns,
  rows,
  rowKey = (r) => r.id,
  sort, onSort,
  selectable = false, selected, onSelected,
  onRowClick, onCursorChange,
  rowClass,
  expanded, onToggleExpand, renderExpanded,
  empty,
  page, onPage, // controlled pageIndex (1-based); internal state otherwise
  pageSize = 50,
  total, // "showing X of N" footer when rows are a pre-paged slice
  bulk, // render-prop (selectedRows, clearSelection) => node
  className,
}) {
  const [density] = useDensity();
  const compact = density === 'compact';
  const [cursor, setCursor] = useState(0);
  const [pageSelf, setPageSelf] = useState(1);
  const selectAllRef = useRef(null);

  const pageIndex = Math.max(1, page ?? pageSelf);
  const setPageIndex = (p) => (onPage ? onPage(p) : setPageSelf(p));

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = pages > 1
    ? rows.slice((pageIndex - 1) * pageSize, pageIndex * pageSize)
    : rows;

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

  const onKeyDown = (e) => {
    if (e.target.closest('input,textarea,select,a,button')) return;
    const k = e.key.toLowerCase();
    if (k === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(slice.length - 1, c + 1));
    } else if (k === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && onRowClick && !e.target.closest('input,textarea,select,a,button')) {
      e.preventDefault();
      const r = slice[cursor];
      if (r) onRowClick(r);
    } else if (e.key === ' ' && selectable) {
      e.preventDefault();
      const r = slice[cursor];
      if (r) toggleSelect(r);
    }
  };

  useEffect(() => { setCursor(0); if (onCursorChange) onCursorChange(0); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [pageIndex, rows]);
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = !allOnPage && slice.some((r) => selection?.has(rowKey(r))); });

  const cellPad = compact ? 'px-3 py-2' : 'px-3 py-2.5';
  const cursorBar = 'shadow-[inset_3px_0_0_0_rgba(243,198,83,0.5)]';

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/10 bg-akg-surface', className)}>
      <div
        role="grid"
        aria-label={name}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="max-[1100px]:overflow-x-auto focus-visible:[outline:none]"
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
          <tbody>
            {slice.map((r, i) => {
              const k = rowKey(r);
              const isCursor = i === cursor;
              const first = selectable ? 1 : 0;
              return (
                <React.Fragment key={k}>
                  <tr
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
            {total !== undefined ? `showing ${slice.length} of ${total}` : `page ${pageIndex} / ${pages}`}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                disabled={pageIndex <= 1}
                className="rounded-lg border border-white/10 p-1 text-akg-muted disabled:opacity-30 hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
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
