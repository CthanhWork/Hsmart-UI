import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ id, image, title, location, price, tags, sold }) => {
  return (
    <Link to={`/product/${id || 'm1'}`} style={{ textDecoration: 'none' }}>
      <div className="shopee-card">
        <div className="shopee-card-image-wrapper">
          <img src={image} alt={title} className="shopee-card-image" loading="lazy" decoding="async" />
          {tags && tags.includes('Mall') && (
            <div className="shopee-mall-badge">Mall</div>
          )}
          {tags && tags.includes('Sale') && (
            <div className="shopee-sale-badge">
              <span className="sale-percent">15%</span>
              <span className="sale-text">GIẢM</span>
            </div>
          )}
        </div>
        <div className="shopee-card-info">
          <div className="shopee-card-title">{title}</div>
          <div className="shopee-card-tags">
            {tags && tags.includes('Freeship') && (
              <span className="freeship-tag">Miễn phí trả hàng</span>
            )}
          </div>
          <div className="shopee-card-price-row">
            <span className="shopee-card-currency">₫</span>
            <span className="shopee-card-price">{price.toLocaleString()}</span>
            <span className="shopee-card-sold">Đã bán {sold || 0}</span>
          </div>
          <div className="shopee-card-location">{location}</div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
