import { useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { apiDeleteProduct, apiFetchMyProducts } from '../services/api';
import './MyHub.css';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

const statusTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang bán' },
  { key: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { key: 'SOLD', label: 'Đã bán' },
  { key: 'HIDDEN', label: 'Đã ẩn' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'Mới nhất' },
  { key: 'price-desc', label: 'Giá cao → thấp' },
  { key: 'price-asc', label: 'Giá thấp → cao' },
  { key: 'name', label: 'Tên A → Z' },
];

const MyHub = () => {
  const { user } = useUser();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetchMyProducts(0, 100)
      .then((page) => setProducts(page.content))
      .catch((requestError) => setError(requestError.message || 'Không thể tải danh sách tin đăng.'));
  }, [user?.id, user?.username]);

  const performDelete = async () => {
    if (!confirmDelete) return;
    const product = confirmDelete;
    setDeleting(true);
    try {
      await apiDeleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success(`Đã xóa tin đăng “${product.title}”.`);
      setConfirmDelete(null);
    } catch (requestError) {
      const message = requestError.message || 'Không thể xóa tin đăng này.';
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const totalValue = products.reduce((sum, product) => sum + Number(product.price || 0), 0);
  const activeListings = products.filter((product) => product.status === 'ACTIVE').length;
  const pendingListings = products.filter((product) => product.status === 'PENDING_REVIEW').length;
  const soldListings = products.filter((product) => product.status === 'SOLD').length;

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesKeyword = !keyword || [
        product.title,
        product.categoryName,
        product.sellerProvince,
        product.sellerDistrict,
        String(product.id),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [products, query, statusFilter]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortKey === 'price-desc') return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sortKey === 'price-asc') return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortKey === 'name') return list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'vi'));
    // recent: id giảm dần (id lớn hơn ~ tin mới hơn)
    return list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }, [filteredProducts, sortKey]);

  return (
    <main className="seller-listings-page">
      <div className="seller-listings-shell">
        <section className="listings-header">
          <h1 className="listings-title">Tin đăng của tôi</h1>

          <Link className="create-listing-btn" to="/sell">
            <Plus size={16} aria-hidden="true" />
            Tạo tin đăng mới
          </Link>
        </section>

        <section className="listings-overview" aria-label="Tóm tắt tin đăng">
          {[
            { key: 'all', label: 'Tổng tin đăng', value: products.length },
            { key: 'ACTIVE', label: 'Đang bán', value: activeListings },
            { key: 'PENDING_REVIEW', label: 'Chờ duyệt', value: pendingListings },
            { key: 'SOLD', label: 'Đã bán', value: soldListings },
          ].map((stat) => (
            <button
              type="button"
              key={stat.key}
              className={`listing-stat-card${statusFilter === stat.key ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(stat.key)}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </button>
          ))}

          <article className="listing-stat-card listing-stat-card--value">
            <span>Tổng giá trị niêm yết</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </article>
        </section>

        {error ? (
          <div className="listings-feedback listings-feedback-error" role="alert">
            {error}
          </div>
        ) : null}

        <section className="listings-surface" aria-label="Danh sách tin đăng">
          <div className="listings-toolbar">
            <label className="listings-search-field">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                name="listingSearch"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, mã tin hoặc khu vực…"
              />
            </label>

            <div className="listing-status-tabs" role="tablist" aria-label="Lọc trạng thái tin đăng">
              {statusTabs.map((tab) => {
                const count = tab.key === 'all'
                  ? products.length
                  : products.filter((product) => product.status === tab.key).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={statusFilter === tab.key ? 'active' : ''}
                    aria-selected={statusFilter === tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label}
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="listings-view-tools">
              <select
                className="listings-sort-select"
                name="listingSort"
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
                aria-label="Sắp xếp tin đăng"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>

              <div className="listings-view-toggle" role="group" aria-label="Kiểu hiển thị">
                <button
                  type="button"
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Dạng lưới"
                  aria-pressed={viewMode === 'grid'}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="Dạng danh sách"
                  aria-pressed={viewMode === 'list'}
                >
                  <List size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            products.length === 0 ? (
              <div className="no-listings-fallback">
                <p>Bạn chưa có tin đăng nào.</p>
                <small>Hãy tạo tin đầu tiên để bắt đầu bán trên H‑Smart.</small>
                <Link to="/sell" className="reset-catalog-btn">
                  Tạo tin đăng đầu tiên
                </Link>
              </div>
            ) : (
              <div className="no-listings-fallback">
                <p>Không có tin đăng nào khớp với bộ lọc hiện tại.</p>
                <small>Thử đổi trạng thái hoặc từ khóa tìm kiếm.</small>
              </div>
            )
          ) : (
            <div className={`listing-card-list${viewMode === 'grid' ? ' is-grid' : ''}`}>
              {sortedProducts.map((product) => (
                <article className="listing-card" key={product.id}>
                  <Link to={`/products/${product.id}`} className="listing-card-main">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="table-product-thumbnail"
                      width="96"
                      height="96"
                      loading="lazy"
                    />

                    <div className="listing-card-copy">
                      <div className="listing-card-copy-top">
                        <h2 className="listing-card-title">{product.title}</h2>
                        <StatusBadge status={product.status} />
                      </div>

                      <div className="listing-meta-row">
                        <span translate="no">Mã tin #{product.id}</span>
                        {product.categoryName ? <span>{product.categoryName}</span> : null}
                        {[product.sellerDistrict, product.sellerProvince].filter(Boolean).length ? (
                          <span>{[product.sellerDistrict, product.sellerProvince].filter(Boolean).join(', ')}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  <div className="listing-card-side">
                    <div className="listing-card-price-block">
                      <span>Giá bán</span>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>

                    <div className="table-actions-group">
                      <Link
                        to={`/products/${product.id}`}
                        className="action-icon-btn view-icon-btn"
                        title="Xem chi tiết sản phẩm"
                        aria-label={`Xem chi tiết sản phẩm ${product.title}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                      </Link>

                      <Link
                        to={`/products/${product.id}/edit`}
                        className="action-icon-btn edit-icon-btn"
                        title="Chỉnh sửa sản phẩm"
                        aria-label={`Chỉnh sửa sản phẩm ${product.title}`}
                      >
                        <Edit3 size={15} aria-hidden="true" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setConfirmDelete(product)}
                        className="action-icon-btn delete-icon-btn"
                        title="Xóa sản phẩm"
                        aria-label={`Xóa sản phẩm ${product.title}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmDelete ? (
        <div
          className="lst-modal-overlay"
          role="presentation"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div
            className="lst-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận xóa tin đăng"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Xóa tin đăng?</h2>
            <p>
              Tin đăng <strong>“{confirmDelete.title}”</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="lst-modal-actions">
              <button
                type="button"
                className="lst-modal-btn lst-modal-cancel"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="lst-modal-btn lst-modal-danger"
                onClick={performDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa…' : 'Xóa tin đăng'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default MyHub;
