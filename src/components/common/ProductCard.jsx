import React from 'react';
import { MapPin } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ image, title, location, price, isVerified, tags }) => {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={image} alt={title} className="product-image" />
        {isVerified && (
          <div className="verified-badge">
            <span className="verified-icon">✨</span> AI VERIFIED
          </div>
        )}
      </div>
      <div className="product-info">
        <div className="product-header">
          <h3 className="product-title">{title}</h3>
          <span className="product-price">{price}</span>
        </div>
        <div className="product-location">
          <MapPin size={12} /> {location}
        </div>
        {tags && tags.length > 0 && (
          <div className="product-tags">
            {tags.map((tag, idx) => (
              <span key={idx} className="product-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
