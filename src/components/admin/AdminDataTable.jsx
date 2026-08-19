import EmptyState from './EmptyState';

const SkeletonRows = ({ columns, rows = 5 }) => (
  Array.from({ length: rows }).map((_, rowIndex) => (
    <tr key={`skeleton-${rowIndex}`} className="adm-skeleton-row">
      {columns.map((column, colIndex) => (
        <td key={column.key || colIndex} data-label={typeof column.header === 'string' ? column.header : undefined}>
          <span className="adm-skeleton-bar" />
        </td>
      ))}
    </tr>
  ))
);

/**
 * Shared admin table that handles loading (skeleton), empty and error states.
 * columns: [{ key, header, render: (row) => node, cellClassName, headClassName }]
 */
const AdminDataTable = ({
  columns,
  rows = [],
  loading = false,
  error = '',
  getRowKey = (row) => row.id,
  onRowClick,
  rowAriaLabel,
  emptyIcon,
  emptyTitle = 'Không có dữ liệu phù hợp.',
  skeletonRows = 6,
  footer,
}) => {
  const showEmpty = !loading && !error && rows.length === 0;

  return (
    <div className="adm-table-card">
      <div className="adm-table-scroll">
        <table className="adm-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.headClassName}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows columns={columns} rows={skeletonRows} /> : null}

            {!loading && !error && rows.map((row) => {
              const clickable = typeof onRowClick === 'function';
              return (
                <tr
                  key={getRowKey(row)}
                  className={clickable ? 'adm-clickable-row' : undefined}
                  onClick={clickable ? () => onRowClick(row) : undefined}
                  onKeyDown={clickable ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(row);
                    }
                  } : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  role={clickable ? 'button' : undefined}
                  aria-label={clickable && rowAriaLabel ? rowAriaLabel(row) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.cellClassName}
                      data-label={typeof column.header === 'string' ? column.header : undefined}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error ? (
        <EmptyState icon={emptyIcon} title={error}>
          Vui lòng thử làm mới lại trang.
        </EmptyState>
      ) : null}

      {showEmpty ? <EmptyState icon={emptyIcon} title={emptyTitle} /> : null}

      {footer}
    </div>
  );
};

export default AdminDataTable;
