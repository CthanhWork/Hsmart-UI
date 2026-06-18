import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { apiDeleteProduct, apiFetchProducts } from '../services/api';
import './MyHub.css';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const MyHub = () => {
  const { user } = useUser();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const sellerKeys = [user?.id, user?.username].filter(Boolean).map(String);
    apiFetchProducts({ size: 100 })
      .then((allProducts) => setProducts(
        allProducts.filter((product) => sellerKeys.includes(String(product.sellerId))),
      ))
      .catch((requestError) => setError(requestError.message));
  }, [user?.id, user?.username]);

  const remove = async (product) => {
    if (!window.confirm(`Xóa "${product.title}"?`)) return;
    try {
      await apiDeleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      toast.success(`Đã xóa tin đăng "${product.title}".`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const totalValue = products.reduce((sum, product) => sum + Number(product.price || 0), 0);
  const averagePrice = products.length ? totalValue / products.length : 0;

  return (
    <div className="uk-section uk-section-default seller-listings-page">
      <div className="uk-container">
        <header className="listings-header">
          <div className="listings-heading-copy">
            <p className="listings-eyebrow">Quản lý tin đăng</p>
            <h1 className="dashboard-title">Tin đăng của tôi</h1>
            <p className="listings-subtitle">
              Theo dõi nhanh sản phẩm đang bán, giá niêm yết và thao tác chỉnh sửa ở một chỗ.
            </p>
          </div>

          <Link className="uk-button uk-button-primary create-listing-btn" to="/sell">
            <Plus size={16} aria-hidden="true" /> Tạo tin đăng
          </Link>
        </header>

        <section className="listings-overview" aria-label="Tóm tắt tin đăng">
          <article className="listing-stat-card">
            <span>Tổng tin đăng</span>
            <strong>{products.length}</strong>
          </article>
          <article className="listing-stat-card">
            <span>Tổng giá trị niêm yết</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </article>
          <article className="listing-stat-card">
            <span>Giá trung bình</span>
            <strong>{formatCurrency(averagePrice)}</strong>
          </article>
        </section>

        {error ? (
          <div className="uk-alert-danger uk-margin-medium-bottom listings-error">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="uk-card uk-card-default uk-card-body table-container-card">
          {products.length === 0 ? (
            <div className="uk-text-center uk-margin-medium-top uk-margin-medium-bottom no-listings-fallback">
              <p className="uk-text-lead uk-text-muted">Bạn chưa có tin đăng nào.</p>
              <Link to="/sell" className="uk-button uk-button-default reset-catalog-btn">
                Tạo tin đăng đầu tiên
              </Link>
            </div>
          ) : (
            <div className="listing-card-list" aria-label="Danh sách tin đăng">
              {products.map((product) => (
                <article className="listing-card" key={product.id}>
                  <Link to={`/products/${product.id}`} className="listing-card-main">
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="table-product-thumbnail"
                      width="72"
                      height="72"
                      loading="lazy"
                    />
                    <div className="listing-card-copy">
                      <h2 className="listing-card-title">{product.title}</h2>
                      <p className="listing-card-meta">Mã sản phẩm #{product.id}</p>
                    </div>
                  </Link>

                  <div className="listing-card-side">
                    <div className="listing-card-price-block">
                      <span>Giá bán</span>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>

                    <div className="listing-card-status">
                      <StatusBadge status={product.status} />
                    </div>

                    <div className="table-actions-group">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="action-icon-btn edit-icon-btn"
                        title="Sửa sản phẩm"
                        aria-label={`Sửa sản phẩm ${product.title}`}
                      >
                        <Edit3 size={15} aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(product)}
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
        </div>
      </div>
    </div>
  );
};

export default MyHub;
