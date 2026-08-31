export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount])).filter(
    (value) => value >= 1 && value <= pageCount
  );

  return (
    <nav className="pagination-bar" aria-label="Pagination">
      <span className="pagination-summary">
        Showing <strong>{firstItem}-{lastItem}</strong> of <strong>{total}</strong> results
      </span>
      <div className="pagination-controls">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="pagination-button"
        >
          Previous
        </button>
        {pages.map((currentPage, index) => (
          <span key={currentPage} className="contents">
            {index > 0 && currentPage - pages[index - 1] > 1 ? <span className="pagination-ellipsis">...</span> : null}
            <button
              aria-current={currentPage === page ? "page" : undefined}
              className={`pagination-button pagination-number ${currentPage === page ? "pagination-current" : ""}`}
              onClick={() => onPageChange(currentPage)}
            >
              {currentPage}
            </button>
          </span>
        ))}
        <button
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
