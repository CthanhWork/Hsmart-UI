import React, { useState, useEffect } from 'react';
import { Sparkles, Refrigerator, WashingMachine, Microwave, Coffee, ChevronDown } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { apiFetchProducts } from '../services/api';
import './Home.css';

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback mock data in case API is unavailable or empty
  const mockListings = [
    {
      id: 'm1',
      imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=600&q=80',
      title: 'Samsung FamilyHub...',
      price: 1249,
      location: 'Brooklyn, NY',
      isVerified: true,
      tags: ['2022 MODEL', 'FREE DELIVERY']
    },
    {
      id: 'm2',
      imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
      title: 'LG ThinQ Front Load...',
      price: 580,
      location: 'Austin, TX',
      isVerified: true,
      tags: ['ENERGY STAR', 'SILENT DRIVE']
    }
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await apiFetchProducts();
        if (data && data.length > 0) {
          setListings(data);
        } else {
          // If API returns empty, show mock data for demonstration
          setListings(mockListings);
        }
      } catch (err) {
        console.error('Failed to fetch from API, using mock data.', err);
        setListings(mockListings);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section container">
        <div className="hero-content">
          <h4 className="hero-subtitle">FUTURE OF RESALE</h4>
          <h1 className="hero-title">
            Precision-certified<br/>
            <span className="text-primary">household tech.</span>
          </h1>
          <p className="hero-desc">
            Every appliance on H-smart is scanned by our proprietary AI to verify condition, specifications, and authenticity. No surprises, just quality.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">Browse Certified</button>
            <button className="btn btn-secondary">How it works</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80" 
              alt="Premium Refrigerator" 
              className="hero-image"
            />
            <div className="hero-ai-card">
              <div className="ai-card-header">
                <div className="ai-icon-bg">
                  <Sparkles size={14} color="var(--primary)" />
                </div>
                <span>AI INTEGRITY SCAN</span>
              </div>
              <div className="ai-card-footer">
                <span className="text-muted">Condition Grade</span>
                <span className="text-success font-bold">A+ (Pristine)</span>
              </div>
              <div className="ai-progress-bar">
                <div className="ai-progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section container">
        <h3 className="section-title">Shop by category</h3>
        <div className="categories-grid">
          <div className="category-card">
            <Refrigerator size={24} strokeWidth={1.5} />
            <span>Refrigerators</span>
          </div>
          <div className="category-card">
            <WashingMachine size={24} strokeWidth={1.5} />
            <span>Washers</span>
          </div>
          <div className="category-card">
            <Microwave size={24} strokeWidth={1.5} />
            <span>Microwaves</span>
          </div>
          <div className="category-card">
            <Refrigerator size={24} strokeWidth={1.5} />
            <span>Ovens</span>
          </div>
          <div className="category-card">
            <Coffee size={24} strokeWidth={1.5} />
            <span>Coffee Tech</span>
          </div>
          <div className="category-card">
            <WashingMachine size={24} strokeWidth={1.5} />
            <span>Dishwashers</span>
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="listings-section container">
        <div className="section-header">
          <h3 className="section-title no-border">Latest Verified Listings</h3>
          <div className="header-actions">
            <button className="filter-btn">FILTER</button>
            <button className="filter-btn">SORT</button>
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading intelligent data...</div>
        ) : (
          <div className="product-grid">
            {listings.map(item => (
              <ProductCard 
                key={item.id} 
                image={item.imageUrl}
                title={item.title}
                price={typeof item.price === 'number' ? `$${item.price}` : item.price}
                location={item.location || 'Verified Location'}
                isVerified={true}
                tags={item.tags || []}
              />
            ))}
          </div>
        )}
        
        <div className="load-more-container">
          <button className="load-more-btn">
            LOAD MORE TECH <ChevronDown size={16} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
