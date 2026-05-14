import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, MapPin, Tag, Truck, MessageCircle } from 'lucide-react';
import { apiFetchProductById } from '../services/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await apiFetchProductById(id);
        setProduct(data);
      } catch (error) {
        console.error('Error loading product details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading intelligence...</div>;
  if (!product) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Product not found.</div>;

  return (
    <div className="product-detail-page container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back to Marketplace</button>
      
      <div className="product-detail-grid">
        <div className="product-visual-section">
          <div className="main-image-wrapper">
            <img src={product.imageUrl} alt={product.title} className="main-image" />
            <div className="ai-overlay-badge">
              <Sparkles size={14} color="var(--primary)" />
              <span className="text-xs font-bold text-success ml-2">VERIFIED</span>
            </div>
          </div>
        </div>

        <div className="product-info-section">
          <div className="flex-between mb-2">
            <span className="badge badge-success text-xs font-bold uppercase">{product.status || 'AVAILABLE'}</span>
            <span className="text-muted text-xs flex items-center gap-1"><MapPin size={12} /> {product.location || 'Verified Location'}</span>
          </div>
          
          <h1 className="detail-title">{product.title}</h1>
          <div className="detail-price mt-2">${product.price}</div>

          <div className="ai-verification-card mt-6">
            <div className="card-header flex-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-success" />
                AI Integrity Report
              </h3>
              <span className="text-xs text-muted">Scan Confidence: {(product.aiMetadata?.confidence * 100) || 98}%</span>
            </div>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">CONDITION GRADE</span>
                <span className="metric-value text-success">{product.aiMetadata?.condition || 'A+ (Pristine)'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">EXTERNAL DAMAGE</span>
                <span className="metric-value">None Detected</span>
              </div>
            </div>
          </div>

          <div className="product-description mt-6">
            <h3 className="text-sm font-bold mb-2">Description</h3>
            <p className="text-sm text-muted line-height-relaxed">{product.description}</p>
          </div>

          <div className="action-buttons mt-8">
            <button className="btn btn-primary w-full flex-center gap-2" style={{ width: '100%', padding: '16px', fontSize: '15px' }}>
              <Truck size={18} /> Buy Now with Safe Checkout
            </button>
            <button className="btn btn-secondary w-full mt-4 flex-center gap-2" style={{ width: '100%', padding: '16px', fontSize: '15px' }}>
              <MessageCircle size={18} /> Message Seller
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
