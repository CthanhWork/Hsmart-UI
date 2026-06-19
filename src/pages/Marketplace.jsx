import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, Store, Truck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { DEFAULT_CATEGORY_THUMBNAIL, getCategoryThumbnail } from '../constants/catalog';
import { apiFetchCategories, apiFetchProductPage } from '../services/api';
import './Marketplace.css';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const shouldForwardToSearch = ['q', 'categoryId', 'page', 'minPrice', 'maxPrice', 'sort']
      .some((key) => searchParams.get(key));

    if (shouldForwardToSearch) {
      navigate(`/search?${searchParams.toString()}`, { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    apiFetchCategories().then(setCategories).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const page = await apiFetchProductPage({
          status: 'APPROVED',
          categoryId: activeCategoryId || undefined,
          size: 15,
        });
        setProducts(page.content || []);
      } catch (requestError) {
        setError(requestError.message || 'Không thể tải sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [activeCategoryId]);

  const featuredCategories = useMemo(() => {
    if (!categories.length) return [];

    if (!activeCategoryId) {
      return categories.slice(0, 8);
    }

    const selected = categories.find((category) => String(category.id) === String(activeCategoryId));
    const rest = categories.filter((category) => String(category.id) !== String(activeCategoryId));
    return [selected, ...rest].filter(Boolean).slice(0, 8);
  }, [activeCategoryId, categories]);

  const activeCategory = categories.find((category) => String(category.id) === String(activeCategoryId));

  const submitSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set('q', query.trim());
    if (activeCategoryId) nextParams.set('categoryId', activeCategoryId);
    navigate(`/search${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
  };

  const openSearchWithCategory = (categoryId = '') => {
    const nextParams = new URLSearchParams();
    if (categoryId) nextParams.set('categoryId', categoryId);
    if (query.trim()) nextParams.set('q', query.trim());
    navigate(`/search${nextParams.toString() ? `?${nextParams.toString()}` : ''}`);
  };

  return (
    <main className="marketplace-catalog-page">
      <div className="marketplace-container">
        <section className="shopee-hero-grid" aria-label="H-Smart">
          <div className="main-promo-banner">
            <div>
              <span className="promo-kicker">H-Smart marketplace</span>
              <h1>Sắm đồ gia dụng giá tốt</h1>
              <p>Máy giặt, sofa, bàn ghế, đồ bếp và nhiều món đã qua sử dụng còn tốt.</p>
              <form className="hero-search-form" onSubmit={submitSearch}>
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Tìm máy giặt, sofa, bàn ăn..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button type="submit">Tìm kiếm</button>
              </form>
            </div>
          </div>

          <div className="side-promo-stack">
            <Link to="/sell" className="side-promo-card seller-promo-card">
              <Store size={20} />
              <strong>Đăng bán trong vài phút</strong>
              <span>Tạo tin bán đồ gia dụng với ảnh, giá và mô tả rõ ràng.</span>
            </Link>
            <Link to="/orders" className="side-promo-card delivery-promo-card">
              <Truck size={20} />
              <strong>Theo dõi giao dịch</strong>
              <span>Đơn hàng, đánh giá và trạng thái đều ở một nơi.</span>
            </Link>
          </div>
        </section>

        <section className="market-section category-spotlight-section">
          <div className="market-section-heading category-heading">
            <div>
              <span>Danh mục nổi bật</span>
              <h2>Khám phá nhanh theo nhóm sản phẩm</h2>
            </div>
            <button className="section-link-button" onClick={() => openSearchWithCategory(activeCategoryId)}>
              Mở trang lọc sản phẩm
            </button>
          </div>

          <div className="category-chip-row" role="tablist" aria-label="Danh mục gợi ý">
            <button
              className={!activeCategoryId ? 'category-chip active' : 'category-chip'}
              onClick={() => setActiveCategoryId('')}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={String(activeCategoryId) === String(category.id) ? 'category-chip active' : 'category-chip'}
                onClick={() => setActiveCategoryId(String(category.id))}
              >
                {category.displayName || category.name}
              </button>
            ))}
          </div>

          <div className="category-spotlight-grid">
            <button
              type="button"
              className="category-spotlight-card category-all-card"
              onClick={() => openSearchWithCategory('')}
            >
              <figure className="category-spotlight-thumb">
                <img src={DEFAULT_CATEGORY_THUMBNAIL} alt="" loading="lazy" />
              </figure>
              <div className="category-spotlight-copy">
                <strong>Xem toàn bộ chợ</strong>
                <span>Mở trang kết quả với đầy đủ bộ lọc và phân trang.</span>
              </div>
              <ArrowRight size={16} />
            </button>

            {featuredCategories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={String(activeCategoryId) === String(category.id) ? 'category-spotlight-card active' : 'category-spotlight-card'}
                onClick={() => openSearchWithCategory(String(category.id))}
              >
                <figure className="category-spotlight-thumb">
                  <img src={getCategoryThumbnail(category)} alt="" loading="lazy" />
                </figure>
                <div className="category-spotlight-copy">
                  <strong>{category.displayName || category.name}</strong>
                  <span>Đi tới trang tìm kiếm riêng của danh mục này.</span>
                </div>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="market-section product-feed-section">
          <div className="feed-title-bar">
            <span>{activeCategory ? `Gợi ý trong ${activeCategory.displayName || activeCategory.name}` : 'Sản phẩm nổi bật hôm nay'}</span>
          </div>

          {error ? (
            <div className="catalog-alert catalog-alert-danger"><p>{error}</p></div>
          ) : null}

          {loading ? (
            <div className="products-catalog-grid">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="catalog-skeleton-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-catalog-state">
              <p>Chưa có sản phẩm phù hợp trong nhóm này.</p>
              <button className="reset-catalog-btn" onClick={() => openSearchWithCategory(activeCategoryId)}>
                Sang trang tìm kiếm nâng cao
              </button>
            </div>
          ) : (
            <>
              <div className="products-catalog-grid">
                {products.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>

              <div className="catalog-footer-action">
                <button className="reset-catalog-btn" onClick={() => openSearchWithCategory(activeCategoryId)}>
                  Xem thêm sản phẩm và bộ lọc
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Marketplace;
