import React, { useState, useEffect } from 'react';
import { apiFetchProducts, apiFetchCategories } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import './Home.css';
import { ChevronRight } from 'lucide-react';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          apiFetchProducts(),
          apiFetchCategories()
        ]);
        setProducts(prodData || []);
        setCategories(catData || []);
      } catch (err) {
        console.error('Home fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="ecommerce-home">
      <div className="top-background"></div>

      <div className="home-container">
        {/* Banner Section */}
        <section className="banner-section">
          <div className="banner-main">
            <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=480&q=80" alt="Main Banner" className="banner-img" />
          </div>
          <div className="banner-side">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&h=230&q=80" alt="Side Banner 1" className="banner-img" />
            <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&h=230&q=80" alt="Side Banner 2" className="banner-img" />
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h3>DANH MỤC</h3>
          </div>
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-item">
                <div className="category-img-wrapper">
                  <img src={cat.img} alt={cat.name} />
                </div>
                <span className="category-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Flash Sale Section */}
        <section className="flash-sale-section">
          <div className="flash-header">
            <div className="flash-title-wrap">
              <h3 style={{color: "#ee4d2d", fontStyle: "italic", fontWeight: "bold", fontSize: "20px", margin: 0}}>FLASH SALE</h3>
              <div className="countdown-timer">
                <span>02</span>:<span>45</span>:<span>12</span>
              </div>
            </div>
            <a href="#" className="see-all">Xem tất cả <ChevronRight size={16}/></a>
          </div>
          <div className="flash-grid">
            {loading ? (
              Array(6).fill(0).map((_, i) => <div key={i} className="skeleton-card" />)
            ) : (
              products.slice(0, 6).map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  location={product.location}
                  image={product.imageUrl || product.image}
                  tags={product.tags}
                  sold={product.sold || Math.floor(Math.random() * 500)}
                />
              ))
            )}
          </div>
        </section>

        {/* Daily Discoveries */}
        <section className="daily-discoveries-section">
          <div className="daily-header">
            <h3>GỢI Ý HÔM NAY</h3>
          </div>
          <div className="daily-grid">
            {loading ? (
              Array(12).fill(0).map((_, i) => <div key={i} className="skeleton-card" />)
            ) : (
              products.map((product, idx) => (
                <ProductCard
                  key={idx}
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  location={product.location}
                  image={product.imageUrl || product.image}
                  tags={product.tags}
                  sold={product.sold || Math.floor(Math.random() * 500)}
                />
              ))
            )}
          </div>
          <div className="load-more-btn-wrapper">
            <button className="load-more-btn">Xem thêm</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;