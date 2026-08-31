import type { CSSProperties, ReactNode } from "react";

export interface DataColumn<T> {
  header: string;
  width?: string;
  align?: "left" | "right";
  wrap?: boolean;
  clip?: boolean;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyTitle = "No records yet",
  emptyHint = "This table stays here. Rows will appear as soon as there is activity.",
  footer,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyHint?: string;
  footer?: ReactNode;
}) {
  const colCount = columns.length;
  const showEmpty = !loading && !error && rows.length === 0;
  const skeletonCount = 6;

  return (
    <div className="data-table-card">
      <div className="data-table-scroll">
        <table className="data-table">
          <colgroup>
            {columns.map((column, index) => (
              <col key={column.header + String(index)} style={column.width ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.header + String(index)} className={cellClass(column)} style={alignStyle(column.align)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonCount }, (_, rowIndex) => (
                  <tr key={`skel-${rowIndex}`} className="data-table-skel-row">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className={cellClass(column)} style={alignStyle(column.align)}>
                        <span className="skel" style={{ width: colIndex === 0 ? "64%" : "42%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {error ? (
              <tr>
                <td colSpan={colCount} className="data-table-empty-cell">
                  <EmptyPanel title="Couldn’t load this table" hint={error} tone="error" />
                </td>
              </tr>
            ) : null}
            {showEmpty ? (
              <tr>
                <td colSpan={colCount} className="data-table-empty-cell">
                  <EmptyPanel title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : null}
            {!loading && !error
              ? rows.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((column, index) => (
                      <td key={column.header + String(index)} className={cellClass(column)} style={alignStyle(column.align)}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
      {footer ? <div className="data-table-footer">{footer}</div> : null}
    </div>
  );
}

function cellClass(column: { wrap?: boolean; clip?: boolean }): string {
  return [column.wrap ? "cell-wrap" : "", column.clip ? "cell-clip" : ""].filter(Boolean).join(" ");
}

function alignStyle(align?: "left" | "right"): CSSProperties | undefined {
  return align === "right" ? { textAlign: "right" } : undefined;
}

function EmptyPanel({ title, hint, tone }: { title: string; hint: string; tone?: "error" }) {
  return (
    <div className={`table-empty ${tone === "error" ? "table-empty-error" : ""}`}>
      <div className="table-empty-icon" aria-hidden>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="8" width="32" height="24" rx="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 16h32M14 8v24" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
      <p className="table-empty-title">{title}</p>
      <p className="table-empty-hint">{hint}</p>
    </div>
  );
}
