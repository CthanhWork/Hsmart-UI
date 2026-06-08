import { useEffect, useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { useUser } from '../context/UserContext';
import { apiDeleteProduct, apiFetchProducts } from '../services/api';
import './Operations.css';

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
    if (!window.confirm(`Delete "${product.title}"?`)) return;
    try {
      await apiDeleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="operations-page container">
      <header className="operations-header">
        <div><p className="eyebrow">Seller</p><h1>My listings</h1><p>Edit product details, mark completed sales, or remove listings.</p></div>
        <Link className="btn btn-primary" to="/sell">Create listing</Link>
      </header>
      {error ? <div className="feedback feedback-error">{error}</div> : null}
      <section className="surface table-shell">
        <table className="data-table">
          <thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td><Link to={`/products/${product.id}`} className="table-product"><img src={product.imageUrl} alt="" /><span>{product.title}</span></Link></td>
                <td>{product.price.toLocaleString('vi-VN')} VND</td>
                <td><StatusBadge status={product.status} /></td>
                <td><div className="icon-actions">
                  <Link to={`/products/${product.id}/edit`} title="Edit product"><Edit3 size={16} /></Link>
                  <button onClick={() => remove(product)} title="Delete product"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? <div className="page-state">You have no visible listings.</div> : null}
      </section>
    </div>
  );
};

export default MyHub;
