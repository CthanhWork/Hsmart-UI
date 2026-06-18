import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import { apiDeleteProduct, apiFetchProducts } from '../services/api';
import './MyHub.css';

const MyHub = () => {
  const { user } = useUser();
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
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="uk-section uk-section-default seller-listings-page">
      <div className="uk-container">
        <header className="listings-header">
          <h1 className="dashboard-title">Tin đăng của tôi</h1>
          <Link className="uk-button uk-button-primary create-listing-btn" to="/sell">
            <Plus size={16} aria-hidden="true" /> Tạo tin đăng
          </Link>
        </header>

        {error ? (
          <div className="uk-alert-danger uk-margin-medium-bottom listings-error">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="uk-card uk-card-default uk-card-body table-container-card">
          <div className="uk-overflow-auto">
            <table className="uk-table uk-table-divider uk-table-hover uk-table-middle data-listings-table">
              <thead>
                <tr>
                  <th className="uk-table-expand">Sản phẩm</th>
                  <th className="uk-table-shrink">Giá</th>
                  <th className="uk-table-shrink">Trạng thái</th>
                  <th className="uk-table-shrink uk-text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link to={`/products/${product.id}`} className="uk-link-reset flex-product-cell">
                        <img src={product.imageUrl} alt="" className="table-product-thumbnail" />
                        <span className="table-product-title-text">{product.title}</span>
                      </Link>
                    </td>
                    <td className="price-cell-value">
                      {product.price.toLocaleString('vi-VN')} VND
                    </td>
                    <td>
                      <StatusBadge status={product.status} />
                    </td>
                    <td>
                      <div className="table-actions-group">
                        <Link
                          to={`/products/${product.id}/edit`}
                          className="action-icon-btn edit-icon-btn"
                          title="Sửa sản phẩm"
                        >
                          <Edit3 size={15} />
                        </Link>
                        <button
                          onClick={() => remove(product)}
                          className="action-icon-btn delete-icon-btn"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 ? (
            <div className="uk-text-center uk-margin-medium-top uk-margin-medium-bottom no-listings-fallback">
              <p className="uk-text-lead uk-text-muted">Bạn chưa có tin đăng nào.</p>
              <Link to="/sell" className="uk-button uk-button-default reset-catalog-btn">
                Tạo tin đăng đầu tiên
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MyHub;
