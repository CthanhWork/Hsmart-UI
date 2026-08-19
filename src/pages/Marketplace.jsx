import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { getCategoryThumbnail } from '../constants/catalog';
import { apiFetchCategories, apiFetchProductPage } from '../services/api';
import './Marketplace.css';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1600&q=80',
    title: 'Sắm đồ gia dụng giá tốt',
    subtitle: 'Máy giặt, sofa, bàn ghế, đồ bếp đã qua sử dụng còn rất tốt.',
  },
  {
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
    title: 'Gian bếp gọn gàng hơn',
    subtitle: 'Bếp, lò, nồi và đồ bếp với mức giá hợp lý.',
  },
  {
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1600&q=80',
    title: 'Không gian nghỉ ngơi thoải mái',
    subtitle: 'Giường, nệm, tủ và đồ nội thất phòng ngủ.',
  },
];

const SIDE_BANNERS = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
];

const PAGE_SIZE = 20;

const SORT_TABS = [
  { value: 'popular', label: 'Phổ biến' },
  { value: 'latest', label: 'Mới nhất' },
  { value: 'topsell', label: 'Bán chạy' },
];

const PRICE_SORT_OPTIONS = [
  { value: '', label: 'Giá' },
  { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [slide, setSlide] = useState(0);
  const [sort, setSort] = useState('popular');
  const [priceSort, setPriceSort] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const shouldForwardToSearch = ['q', 'page', 'minPrice', 'maxPrice']
      .some((key) => searchParams.get(key));

    if (shouldForwardToSearch) {
      navigate(`/search?${searchParams.toString()}`, { replace: true });
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    apiFetchCategories().then(setCategories).catch((requestError) => setError(requestError.message));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const pageResult = await apiFetchProductPage({
          status: 'APPROVED',
          categoryId: activeCategoryId || undefined,
          size: 60,
        });
        setProducts(pageResult.content || []);
      } catch (requestError) {
        setError(requestError.message || 'Không thể tải sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [activeCategoryId]);

  const processedProducts = useMemo(() => {
    const list = [...products];

    if (priceSort === 'price-asc') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (priceSort === 'price-desc') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === 'latest') {
      list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    } else {
      list.sort((a, b) => Number(b.likeCount || 0) - Number(a.likeCount || 0));
    }

    return list;
  }, [products, sort, priceSort]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = processedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeTab = priceSort ? '' : sort;
  const promoShortcuts = categories.slice(0, 10);

  const goToSlide = (index) => setSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length);

  const selectCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    setPage(1);
  };

  const selectSort = (value) => {
    setSort(value);
    setPriceSort('');
    setPage(1);
  };

  const selectPriceSort = (value) => {
    setPriceSort(value);
    setPage(1);
  };

  const goToProductPage = (nextPage) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  };

  const openCategorySearch = (categoryId) => {
    navigate(`/search?categoryId=${categoryId}`);
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const window = 2;
    for (let i = 1; i <= totalPages; i += 1) {
      if (i === 1 || i === totalPages || (i >= currentPage - window && i <= currentPage + window)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '…') {
        pages.push('…');
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <main className="mp-page">
      <div className="mp-container">
        {/* ===== Banner ===== */}
        <section className="mp-banner" aria-label="H-Smart">
          <div className="mp-carousel">
            <div className="mp-carousel-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {HERO_SLIDES.map((item) => (
                <Link
                  to="/search"
                  key={item.title}
                  className="mp-slide"
                  style={{ backgroundImage: `url(${item.image})` }}
                >
                  <div className="mp-slide-copy">
                    <span className="mp-kicker">H-Smart</span>
                    <h1>{item.title}</h1>
                    <p>{item.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>

            <button type="button" className="mp-carousel-nav prev" onClick={() => goToSlide(slide - 1)} aria-label="Banner trước">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className="mp-carousel-nav next" onClick={() => goToSlide(slide + 1)} aria-label="Banner sau">
              <ChevronRight size={22} />
            </button>

            <div className="mp-dots">
              {HERO_SLIDES.map((item, index) => (
                <button
                  type="button"
                  key={item.title}
                  className={index === slide ? 'active' : ''}
                  onClick={() => goToSlide(index)}
                  aria-label={`Banner ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="mp-banner-side">
            {SIDE_BANNERS.map((src) => (
              <Link
                to="/search"
                key={src}
                className="mp-banner-side-item"
                style={{ backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        </section>

        {/* ===== Promo shortcuts strip ===== */}
        <ul className="mp-promo-strip">
          {promoShortcuts.map((category) => (
            <li key={category.id}>
              <button type="button" onClick={() => openCategorySearch(category.id)}>
                <span className="mp-promo-thumb">
                  <img src={getCategoryThumbnail(category)} alt="" loading="lazy" />
                </span>
                <span className="mp-promo-title">{category.displayName || category.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* ===== Content: category sidebar + product area ===== */}
        <div className="mp-content">
          <aside className="mp-category" aria-label="Danh mục">
            <h3 className="mp-category-heading"><Menu size={16} /> Danh mục</h3>
            <ul className="mp-category-list">
              <li>
                <button
                  type="button"
                  className={!activeCategoryId ? 'active' : ''}
                  onClick={() => selectCategory('')}
                >
                  Tất cả sản phẩm
                </button>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className={String(activeCategoryId) === String(category.id) ? 'active' : ''}
                    onClick={() => selectCategory(String(category.id))}
                  >
                    {category.displayName || category.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="mp-main">
            <div className="mp-filter">
              <span className="mp-filter-label">Sắp xếp theo</span>

              {SORT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={activeTab === tab.value ? 'mp-filter-btn active' : 'mp-filter-btn'}
                  onClick={() => selectSort(tab.value)}
                >
                  {tab.label}
                </button>
              ))}

              <label className="mp-filter-price">
                <select value={priceSort} onChange={(event) => selectPriceSort(event.target.value)} aria-label="Sắp xếp theo giá">
                  {PRICE_SORT_OPTIONS.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronRight size={14} />
              </label>

              <div className="mp-filter-page">
                <span><b>{currentPage}</b>/{totalPages}</span>
                <div className="mp-filter-page-ctrl">
                  <button type="button" disabled={currentPage <= 1} onClick={() => goToProductPage(currentPage - 1)} aria-label="Trang trước">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => goToProductPage(currentPage + 1)} aria-label="Trang sau">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {error ? <div className="mp-alert"><p>{error}</p></div> : null}

            {loading ? (
              <div className="mp-grid">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="mp-skeleton" />
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="mp-empty">
                <p>Chưa có sản phẩm trong nhóm này.</p>
                <button type="button" onClick={() => selectCategory('')}>Xem tất cả sản phẩm</button>
              </div>
            ) : (
              <>
                <div className="mp-grid">
                  {paginatedProducts.map((product) => (
                    <ProductCard product={product} key={product.id} />
                  ))}
                </div>

                <ul className="mp-pagination">
                  <li>
                    <button type="button" disabled={currentPage <= 1} onClick={() => goToProductPage(currentPage - 1)} aria-label="Trang trước">
                      <ChevronLeft size={16} />
                    </button>
                  </li>
                  {pageNumbers.map((number, index) => (
                    <li key={`${number}-${index}`}>
                      {number === '…' ? (
                        <span className="mp-pagination-gap">…</span>
                      ) : (
                        <button
                          type="button"
                          className={number === currentPage ? 'active' : ''}
                          onClick={() => goToProductPage(number)}
                        >
                          {number}
                        </button>
                      )}
                    </li>
                  ))}
                  <li>
                    <button type="button" disabled={currentPage >= totalPages} onClick={() => goToProductPage(currentPage + 1)} aria-label="Trang sau">
                      <ChevronRight size={16} />
                    </button>
                  </li>
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Marketplace;
