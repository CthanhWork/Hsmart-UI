import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './ProductCard.css';

const ProductCard = ({ product }) => (
  <Link to={`/products/${product.id}`} className="product-card">
    <div className="product-card-media">
      <img src={product.imageUrl} alt={product.title} loading="lazy" />
    </div>
    <div className="product-card-body">
      <div className="product-card-meta">
        <StatusBadge status={product.status} />
        <span><Heart size={13} /> {product.likeCount}</span>
      </div>
      <h2>{product.title}</h2>
      <p>{product.categoryName || 'Uncategorized'}</p>
      <strong>{Number(product.price).toLocaleString('vi-VN')} VND</strong>
    </div>
  </Link>
);

export default ProductCard;
