import { RefreshCw } from 'lucide-react';

const AdminPageHeader = ({ eyebrow, title, description, onRefresh, refreshing, children }) => (
  <header className="adm-page-head">
    <div className="adm-page-head-copy">
      {eyebrow ? <span className="adm-eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>

    <div className="adm-page-head-actions">
      {children}
      {onRefresh ? (
        <button
          type="button"
          className="adm-btn adm-btn-ghost"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw size={16} aria-hidden="true" className={refreshing ? 'adm-spin' : undefined} />
          {refreshing ? 'Đang tải…' : 'Làm mới'}
        </button>
      ) : null}
    </div>
  </header>
);

export default AdminPageHeader;
