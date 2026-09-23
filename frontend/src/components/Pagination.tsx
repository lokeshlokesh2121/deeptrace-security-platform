import "./Pagination.css";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  page,
  limit,
  total,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Build a compact list of page numbers (max 5 visible + ellipses)
  const pages: (number | "...")[] = [];
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);

  let from = Math.max(1, page - half);
  let to = Math.min(totalPages, page + half);

  if (to - from + 1 < windowSize) {
    if (from === 1) to = Math.min(totalPages, windowSize);
    else if (to === totalPages) from = Math.max(1, totalPages - windowSize + 1);
  }

  if (from > 1) {
    pages.push(1);
    if (from > 2) pages.push("...");
  }

  for (let i = from; i <= to; i++) pages.push(i);

  if (to < totalPages) {
    if (to < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of{" "}
        <strong>{total}</strong>
      </span>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          ‹ Prev
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`gap-${idx}`} className="pagination-gap">
              …
            </span>
          ) : (
            <button
              key={p}
              className={
                p === page
                  ? "pagination-btn active"
                  : "pagination-btn"
              }
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;