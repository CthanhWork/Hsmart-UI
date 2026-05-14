import React, { useState, useEffect } from 'react';
import ProductCard from '../components/common/ProductCard';
import { ChevronDown } from 'lucide-react';
import { apiFetchProducts } from '../services/api';
import './Marketplace.css';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await apiFetchProducts();
        setListings(data || []);
      } catch (err) {
        console.error('Failed to fetch from API', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="marketplace-page container">
      <div className="marketplace-header flex-between">
        <div>
          <span className="text-xs text-success font-bold uppercase tracking-wide">VERIFIED MARKETPLACE</span>
          <h1 className="page-title mt-2">The Precision Selection</h1>
        </div>
        <div className="marketplace-actions">
          <span className="text-sm text-muted">Showing {listings.length} results</span>
          <button className="btn btn-secondary" style={{ padding: '8px 16px', background: 'transparent', fontWeight: 600 }}>
            Sort by: Newest <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="marketplace-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <h4 className="filter-title uppercase text-xs font-bold tracking-wide mb-4">FILTERS</h4>
          
          <div className="filter-group">
            <h5 className="font-bold text-sm mb-4">AI Condition Grade</h5>
            <label className="checkbox-label">
              <input type="radio" name="grade" defaultChecked />
              <span>Grade A+</span>
              <span className="badge badge-success ml-auto">Pristine</span>
            </label>
            <label className="checkbox-label">
              <input type="radio" name="grade" />
              <span>Grade A</span>
            </label>
            <label className="checkbox-label">
              <input type="radio" name="grade" />
              <span>Grade B</span>
            </label>
          </div>

          <div className="filter-group mt-8">
            <h5 className="font-bold text-sm mb-4">Year of Release</h5>
            <div className="pill-grid">
              <button className="pill-btn active">2024</button>
              <button className="pill-btn">2023</button>
              <button className="pill-btn">2022</button>
              <button className="pill-btn">Older</button>
            </div>
          </div>

          <div className="filter-group mt-8">
            <h5 className="font-bold text-sm mb-4">Energy Efficiency</h5>
            <div className="range-slider-mock">
              <div className="range-track">
                <div className="range-fill"></div>
                <div className="range-thumb"></div>
              </div>
              <div className="flex-between text-xs font-bold mt-2">
                <span>B</span>
                <span>A++</span>
              </div>
            </div>
          </div>

          <div className="filter-info-card mt-8">
            <h5 className="font-bold text-sm text-success flex items-center gap-2 mb-2">
              <span className="ai-icon">✨</span> AI Verification Active
            </h5>
            <p className="text-xs text-muted line-height-relaxed">
              Every listing is cross-referenced with 42 diagnostic markers before approval.
            </p>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="marketplace-grid">
          {loading ? (
            <div style={{ color: '#666', gridColumn: '1 / -1', padding: '40px' }}>Loading intelligent data...</div>
          ) : (
            listings.map(item => (
              <div key={item.id} className="market-card-wrapper">
                 <ProductCard 
                   image={item.imageUrl}
                   title={item.title}
                   price={typeof item.price === 'number' ? `$${item.price}` : item.price}
                   location={item.location || 'Verified by AI'}
                   isVerified={true}
                   tags={item.tags || []}
                 />
                 <div className="market-card-extra">
                   <div className="flex-between text-xs font-bold mb-2">
                     <span className="text-muted uppercase">SEAL INTEGRITY</span>
                     <span className="text-success">99%</span>
                   </div>
                   <div className="progress-bar-container mb-4">
                     <div className="progress-bar-fill" style={{ width: '99%' }}></div>
                   </div>
                   <button className="btn btn-secondary w-full" style={{ width: '100%' }}>
                     View Full Intelligence
                   </button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
