import { useEffect, useState } from 'react';
import ProductCard from '../components/common/ProductCard';
import { apiFetchWishlist } from '../services/api';
import './Operations.css';

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetchWishlist().then((page) => setProducts(page.content)).catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <div className="operations-page container">
      <header className="operations-header"><div><p className="eyebrow">Account</p><h1>Wishlist</h1><p>Products you saved for later.</p></div></header>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      {!error && products.length === 0 ? <div className="page-state">Your wishlist is empty.</div> : null}
      <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    </div>
  );
};

export default Wishlist;
