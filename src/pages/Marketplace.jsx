import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Grid2X2,
  MessageCircle,
  PackagePlus,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Truck,
  Zap,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { apiFetchCategories, apiFetchProductPage, apiSearchProducts } from '../services/api';
import './Marketplace.css';

const quickActions = [
  { label: 'Deal tốt mỗi ngày', icon: Tag, to: '/' },
  { label: 'Người bán uy tín', icon: BadgeCheck, to: '/' },
  { label: 'Đăng bán nhanh', icon: PackagePlus, to: '/sell' },
  { label: 'Chat trước khi mua', icon: MessageCircle, to: '/chat' },
  { label: 'Giao dịch an toàn', icon: ShieldCheck, to: '/orders' },
];

const DEFAULT_CATEGORY_THUMBNAIL = 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=360&q=80';

const CATEGORY_THUMBNAILS = {
  air_conditioner: 'https://images.unsplash.com/photo-1590756254933-2873d72a83b6?auto=format&fit=crop&w=360&q=80',
  automatic_washer: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=360&q=80',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=360&q=80',
  bedspread: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=360&q=80',
  bench: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=360&q=80',
  blender: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=360&q=80',
  bunk_bed: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=360&q=80',
  cabinet: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=360&q=80',
  chair: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=360&q=80',
  coffee_table: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=360&q=80',
  cupboard: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=360&q=80',
  deck_chair: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=360&q=80',
  desk: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=360&q=80',
  dining_table: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=360&q=80',
  drawer: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=360&q=80',
  electric_chair: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=360&q=80',
  fan: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=360&q=80',
  faucet: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=360&q=80',
  file_cabinet: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=360&q=80',
  folding_chair: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=360&q=80',
  highchair: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=360&q=80',
  kettle: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=360&q=80',
  kitchen_sink: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=360&q=80',
  kitchen_table: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=360&q=80',
  lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80',
  mattress: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=360&q=80',
  microwave_oven: 'https://images.unsplash.com/photo-1565357253897-79d691886a73?auto=format&fit=crop&w=360&q=80',
  mirror: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=360&q=80',
  oven: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=360&q=80',
  recliner: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=360&q=80',
  rocking_chair: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=360&q=80',
  sink: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=360&q=80',
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=360&q=80',
  sofa_bed: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=360&q=80',
  stool: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=360&q=80',
  stove: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=360&q=80',
  table: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=360&q=80',
  table_lamp: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=80',
  television_set: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=360&q=80',
  toaster_oven: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=360&q=80',
  vacuum_cleaner: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=360&q=80',
  wardrobe: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=360&q=80',
  water_faucet: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=360&q=80',
};

const getCategoryThumbnail = (category) => (
  category?.imageUrl
  || category?.thumbnailUrl
  || category?.photoUrl
  || CATEGORY_THUMBNAILS[category?.name]
  || DEFAULT_CATEGORY_THUMBNAIL
);

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetchCategories().then(setCategories).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const routeQuery = searchParams.get('q') || '';
        const routeCategory = searchParams.get('categoryId') || '';
        const page = routeQuery
          ? await apiSearchProducts(routeQuery)
          : await apiFetchProductPage({
              status: 'APPROVED',
              categoryId: routeCategory || undefined,
              size: 48,
            });
        setProducts(page.content || page);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [searchParams]);

  const featuredProducts = useMemo(() => products.slice(0, 6), [products]);
  const homeCategories = useMemo(() => categories.slice(0, 16), [categories]);

  const submitSearch = (event) => {
    event.preventDefault();
    const next = {};
    if (query.trim()) next.q = query.trim();
    if (!query.trim() && categoryId) next.categoryId = categoryId;
    setSearchParams(next);
  };

  const selectCategory = (value) => {
    setCategoryId(value);
    setQuery('');
    setSearchParams(value ? { categoryId: value } : {});
  };

  return (
    <main className="marketplace-catalog-page">
      <div className="marketplace-container">
        <section className="shopee-hero-grid" aria-label="Khuyến mãi H-Smart">
          <div className="main-promo-banner">
            <div>
              <span className="promo-kicker">H-Smart Sale</span>
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

        <section className="market-shortcut-strip" aria-label="Lối tắt">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link to={action.to} className="market-shortcut-item" key={action.label}>
                <span><Icon size={20} /></span>
                <strong>{action.label}</strong>
              </Link>
            );
          })}
        </section>

        <section className="market-section category-mall-section">
          <div className="market-section-heading">
            <div>
              <span>Danh mục</span>
              <h2>Mua sắm theo nhóm sản phẩm</h2>
            </div>
            <button className="section-link-button" onClick={() => selectCategory('')}>
              Tất cả
            </button>
          </div>

          <div className="category-mall-grid">
            <button
              className={!categoryId ? 'category-mall-item active' : 'category-mall-item'}
              onClick={() => selectCategory('')}
            >
              <figure className="category-thumb">
                <img
                  src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=360&q=80"
                  alt=""
                  loading="lazy"
                />
                <Grid2X2 size={18} aria-hidden="true" />
              </figure>
              <strong>Tất cả</strong>
            </button>
            {homeCategories.map((category) => (
              <button
                key={category.id}
                className={String(categoryId) === String(category.id) ? 'category-mall-item active' : 'category-mall-item'}
                onClick={() => selectCategory(String(category.id))}
              >
                <figure className="category-thumb">
                  <img
                    src={getCategoryThumbnail(category)}
                    alt=""
                    loading="lazy"
                  />
                </figure>
                <strong>{category.displayName || category.name}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="market-section flash-sale-section">
          <div className="market-section-heading flash-heading">
            <div>
              <span><Zap size={17} /> Flash Sale</span>
              <h2>Gợi ý đang nổi bật</h2>
            </div>
            <Link to="/" className="section-link-button">Xem tất cả</Link>
          </div>

          {error ? (
            <div className="catalog-alert catalog-alert-danger">
              <p>{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="flash-product-row">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="catalog-skeleton-card" key={index} />
              ))}
            </div>
          ) : (
            <div className="flash-product-row">
              {featuredProducts.map((product) => (
                <ProductCard product={product} variant="compact" key={product.id} />
              ))}
            </div>
          )}
        </section>

        <section className="market-section product-feed-section">
          <div className="feed-title-bar">
            <span>Gợi ý hôm nay</span>
          </div>

          {loading ? (
            <div className="products-catalog-grid">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="catalog-skeleton-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-catalog-state">
              <p>Không tìm thấy sản phẩm phù hợp.</p>
              <button className="reset-catalog-btn" onClick={() => selectCategory('')}>
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="products-catalog-grid">
              {products.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Marketplace;
