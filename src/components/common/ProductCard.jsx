import { Heart, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, variant = 'default' }) => {
  const formattedPrice = `${Number(product.price || 0).toLocaleString('vi-VN')}đ`;
  const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';
  const salePercent = Math.min(42, Math.max(8, (Number(product.id || 1) * 7) % 45));
  const location = [product.sellerDistrict, product.sellerProvince].filter(Boolean).join(', ') || 'Toàn quốc';

  return (
    <article className={`hsmart-product-card ${variant === 'compact' ? 'compact-card' : ''}`}>
      <Link to={`/products/${product.id}`} className="commerce-product-tile">
        <figure className="tile-image-wrap">
          <img src={imageUrl} alt={product.title} loading="lazy" />
          <span className="sale-corner-badge">-{salePercent}%</span>
        </figure>

        <div className="commerce-tile-body">
          <span className="category-tag">{product.categoryName || 'Chưa phân loại'}</span>
          <h3 className="product-title-text">{product.title}</h3>

          <div className="product-price-row">
            <strong>{formattedPrice}</strong>
            <span className="tile-likes">
              <Heart size={13} className="heart-icon" /> {product.likeCount || 0}
            </span>
          </div>

          <div className="product-card-meta">
            <span><MapPin size={12} /> {location}</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
