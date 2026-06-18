import { useEffect, useState } from 'react';
import ProductCard from '../components/common/ProductCard';
import { apiFetchWishlist } from '../services/api';
import './Marketplace.css';

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetchWishlist()
      .then((page) => setProducts(page.content || page))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="uk-section uk-section-default marketplace-catalog-page">
      <div className="uk-container">
        <header className="catalog-page-header">
          <h1 className="catalog-title">Sản phẩm đã lưu</h1>
        </header>

        {error ? (
          <div className="uk-alert-danger uk-margin-medium-bottom catalog-page-alert">
            <p>{error}</p>
          </div>
        ) : null}

        {!error && products.length === 0 ? (
          <div className="uk-text-center uk-margin-large-top uk-margin-large-bottom empty-catalog-state">
            <p>Danh sách đã lưu của bạn đang trống.</p>
          </div>
        ) : (
          <div className="uk-grid-medium uk-child-width-1-2 uk-child-width-1-3@s uk-child-width-1-4@m products-catalog-grid" uk-grid="true">
            {products.map((product) => (
              <div key={product.id} className="catalog-grid-item">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
