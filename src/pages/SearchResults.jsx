import { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { apiFetchCategories, apiFetchProductPage } from '../services/api';
import './SearchResults.css';

const PAGE_SIZE = 12;

const sanitizePositiveNumber = (value) => {
  if (!value) return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? String(numeric) : '';
};

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeQuery = (searchParams.get('q') || '').trim();
  const activeCategoryId = searchParams.get('categoryId') || '';
  const activeMinPrice = sanitizePositiveNumber(searchParams.get('minPrice') || '');
  const activeMaxPrice = sanitizePositiveNumber(searchParams.get('maxPrice') || '');
  const activeSort = searchParams.get('sort') || 'relevant';
  const activePage = Math.max(1, Number(searchParams.get('page') || 1));

  const [draftQuery, setDraftQuery] = useState(activeQuery);
  const [draftCategoryId, setDraftCategoryId] = useState(activeCategoryId);
  const [draftMinPrice, setDraftMinPrice] = useState(activeMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(activeMaxPrice);
  const [draftSort, setDraftSort] = useState(activeSort);

  useEffect(() => {
    setDraftQuery(activeQuery);
    setDraftCategoryId(activeCategoryId);
    setDraftMinPrice(activeMinPrice);
    setDraftMaxPrice(activeMaxPrice);
    setDraftSort(activeSort);
  }, [activeCategoryId, activeMaxPrice, activeMinPrice, activeQuery, activeSort]);

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
          keyword: activeQuery || undefined,
          categoryId: activeCategoryId || undefined,
          size: 120,
        });

        setProducts(page.content || []);
      } catch (requestError) {
        setError(requestError.message || 'Không thể tải danh sách sản phẩm.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [activeCategoryId, activeQuery]);

  const processedProducts = useMemo(() => {
    const minPrice = activeMinPrice ? Number(activeMinPrice) : null;
    const maxPrice = activeMaxPrice ? Number(activeMaxPrice) : null;

    let nextProducts = products.filter((product) => {
      const price = Number(product.price || 0);
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });

    nextProducts = [...nextProducts].sort((first, second) => {
      switch (activeSort) {
        case 'price-asc':
          return Number(first.price || 0) - Number(second.price || 0);
        case 'price-desc':
          return Number(second.price || 0) - Number(first.price || 0);
        case 'popular':
          return Number(second.likeCount || 0) - Number(first.likeCount || 0);
        case 'latest':
          return Number(second.id || 0) - Number(first.id || 0);
        default:
          return 0;
      }
    });

    return nextProducts;
  }, [activeMaxPrice, activeMinPrice, activeSort, products]);

  const totalPages = Math.max(1, Math.ceil(processedProducts.length / PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);
  const paginatedProducts = processedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (activePage !== currentPage) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('page', String(currentPage));
      setSearchParams(nextParams, { replace: true });
    }
  }, [activePage, currentPage, searchParams, setSearchParams]);

  const updateSearchParams = (updates) => {
    const nextParams = new URLSearchParams();
    const nextQuery = updates.q ?? activeQuery;
    const nextCategoryId = updates.categoryId ?? activeCategoryId;
    const nextMinPrice = updates.minPrice ?? activeMinPrice;
    const nextMaxPrice = updates.maxPrice ?? activeMaxPrice;
    const nextSort = updates.sort ?? activeSort;
    const nextPage = updates.page ?? 1;

    if (nextQuery) nextParams.set('q', nextQuery);
    if (nextCategoryId) nextParams.set('categoryId', nextCategoryId);
    if (nextMinPrice) nextParams.set('minPrice', nextMinPrice);
    if (nextMaxPrice) nextParams.set('maxPrice', nextMaxPrice);
    if (nextSort && nextSort !== 'relevant') nextParams.set('sort', nextSort);
    if (nextPage > 1) nextParams.set('page', String(nextPage));

    setSearchParams(nextParams);
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    updateSearchParams({
      q: draftQuery.trim(),
      categoryId: draftCategoryId,
      minPrice: sanitizePositiveNumber(draftMinPrice),
      maxPrice: sanitizePositiveNumber(draftMaxPrice),
      sort: draftSort,
      page: 1,
    });
  };

  const clearFilters = () => {
    setDraftQuery(activeQuery);
    setDraftCategoryId('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftSort('relevant');
    updateSearchParams({
      q: activeQuery,
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      sort: 'relevant',
      page: 1,
    });
  };

  const activeCategory = categories.find((category) => String(category.id) === String(activeCategoryId));

  return (
    <main className="search-results-page">
      <div className="search-results-shell">
        <aside className="search-filters-panel">
          <div className="search-panel-card">
            <div className="search-panel-title">
              <Filter size={16} />
              <h2>Bộ lọc</h2>
            </div>

            <form className="search-filters-form" onSubmit={handleApplyFilters}>
              <label className="search-field-group">
                <span>Từ khóa</span>
                <div className="search-inline-input">
                  <Search size={16} />
                  <input
                    type="search"
                    value={draftQuery}
                    onChange={(event) => setDraftQuery(event.target.value)}
                    placeholder="Tìm ghế, tủ, bàn..."
                  />
                </div>
              </label>

              <label className="search-field-group">
                <span>Danh mục</span>
                <select value={draftCategoryId} onChange={(event) => setDraftCategoryId(event.target.value)}>
                  <option value="">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.displayName || category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="search-price-grid">
                <label className="search-field-group">
                  <span>Giá từ</span>
                  <input
                    type="number"
                    min="0"
                    value={draftMinPrice}
                    onChange={(event) => setDraftMinPrice(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="search-field-group">
                  <span>Giá đến</span>
                  <input
                    type="number"
                    min="0"
                    value={draftMaxPrice}
                    onChange={(event) => setDraftMaxPrice(event.target.value)}
                    placeholder="10.000.000"
                  />
                </label>
              </div>

              <label className="search-field-group">
                <span>Sắp xếp</span>
                <select value={draftSort} onChange={(event) => setDraftSort(event.target.value)}>
                  <option value="relevant">Phù hợp nhất</option>
                  <option value="latest">Mới nhất</option>
                  <option value="popular">Được quan tâm nhiều</option>
                  <option value="price-asc">Giá thấp đến cao</option>
                  <option value="price-desc">Giá cao đến thấp</option>
                </select>
              </label>

              <div className="search-filter-actions">
                <button type="submit" className="btn btn-primary">Áp dụng</button>
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>Xóa lọc</button>
              </div>
            </form>
          </div>
        </aside>

        <section className="search-results-content">
          <div className="search-summary-card">
            <div className="search-summary-copy">
              <span className="search-summary-kicker">
                <SlidersHorizontal size={14} />
                Kết quả tìm kiếm
              </span>
              <h1>
                {activeQuery
                  ? `Kết quả cho “${activeQuery}”`
                  : activeCategory
                    ? activeCategory.displayName || activeCategory.name
                    : 'Tất cả sản phẩm'}
              </h1>
              <p>
                {processedProducts.length} sản phẩm phù hợp
                {activeCategory ? ` trong nhóm ${activeCategory.displayName || activeCategory.name}` : ''}
                .
              </p>
            </div>

            <div className="search-summary-meta">
              <span>Trang {currentPage}/{totalPages}</span>
              <span>{PAGE_SIZE} sản phẩm / trang</span>
            </div>
          </div>

          {error ? (
            <div className="catalog-alert catalog-alert-danger"><p>{error}</p></div>
          ) : null}

          {loading ? (
            <div className="search-results-grid">
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className="catalog-skeleton-card" />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="search-empty-state">
              <h3>Không tìm thấy sản phẩm phù hợp</h3>
              <p>Thử nới khoảng giá, đổi danh mục hoặc rút gọn từ khóa tìm kiếm.</p>
              <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                Làm mới bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="search-results-grid">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="search-pagination">
                <button
                  type="button"
                  className="search-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => updateSearchParams({ page: currentPage - 1 })}
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      type="button"
                      key={pageNumber}
                      className={pageNumber === currentPage ? 'search-page-btn active' : 'search-page-btn'}
                      onClick={() => updateSearchParams({ page: pageNumber })}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="search-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateSearchParams({ page: currentPage + 1 })}
                >
                  Sau
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default SearchResults;
