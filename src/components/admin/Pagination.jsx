const Pagination = ({ page, onChange }) => {
  if (!page || page.totalElements === 0) return null;

  return (
    <div className="adm-pagination">
      <p>
        Trang {page.pageNo + 1} / {Math.max(page.totalPages, 1)}
        {' · '}
        {page.totalElements} kết quả
      </p>

      <div className="adm-pagination-actions">
        <button
          type="button"
          className="adm-pagination-button"
          onClick={() => onChange(Math.max(0, page.pageNo - 1))}
          disabled={page.pageNo <= 0}
        >
          Trước
        </button>
        <button
          type="button"
          className="adm-pagination-button"
          onClick={() => onChange(page.pageNo + 1)}
          disabled={page.last || page.pageNo + 1 >= page.totalPages}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default Pagination;
