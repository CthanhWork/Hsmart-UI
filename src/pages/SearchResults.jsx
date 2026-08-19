import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { apiFetchCategories, apiFetchProductPage, apiFetchProvinces } from '../services/api';
import './SearchResults.css';

const PAGE_SIZE = 20;

const SORT_TABS = [
  { value: 'relevant', label: 'Liên quan' },
  { value: 'latest', label: 'Mới nhất' },
  { value: 'popular', label: 'Bán chạy' },
];

const PRICE_SORT_OPTIONS = [
  { value: '', label: 'Giá' },
  { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
];

const sanitizePositiveNumber = (value) => {
  if (!value) return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? String(numeric) : '';
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeQuery = (searchParams.get('q') || '').trim();
  const activeCategoryId = searchParams.get('categoryId') || '';
  const activeProvinceCode = searchParams.get('provinceCode') || '';
  const activeMinPrice = sanitizePositiveNumber(searchParams.get('minPrice') || '');
  const activeMaxPrice = sanitizePositiveNumber(searchParams.get('maxPrice') || '');
  const activeSort = searchParams.get('sort') || 'relevant';
  const activePage = Math.max(1, Number(searchParams.get('page') || 1));

  const [draftProvinceCode, setDraftProvinceCode] = useState(activeProvinceCode);
  const [draftMinPrice, setDraftMinPrice] = useState(activeMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(activeMaxPrice);

  useEffect(() => {
    setDraftProvinceCode(activeProvinceCode);
    setDraftMinPrice(activeMinPrice);
    setDraftMaxPrice(activeMaxPrice);
  }, [activeProvinceCode, activeMaxPrice, activeMinPrice]);

  useEffect(() => {
    apiFetchCategories()
      .then(setCategories)
      .catch((requestError) => setError(requestError.message || 'Không thể tải danh mục.'));
  }, []);

  useEffect(() => {
    apiFetchProvinces()
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => setProvinces([]));
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
          provinceCode: activeProvinceCode || undefined,
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
  }, [activeCategoryId, activeProvinceCode, activeQuery]);

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

  const activeCategory = categories.find((category) => String(category.id) === String(activeCategoryId));
  const totalPages = Math.max(1, Math.ceil(processedProducts.length / PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);
  const paginatedProducts = processedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeTabSort = SORT_TABS.find((tab) => tab.value === activeSort)?.value || '';
  const activePriceSort = activeSort === 'price-asc' || activeSort === 'price-desc' ? activeSort : '';

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
    const nextProvinceCode = updates.provinceCode ?? activeProvinceCode;
    const nextMinPrice = updates.minPrice ?? activeMinPrice;
    const nextMaxPrice = updates.maxPrice ?? activeMaxPrice;
    const nextSort = updates.sort ?? activeSort;
    const nextPage = updates.page ?? 1;

    if (nextQuery) nextParams.set('q', nextQuery);
    if (nextCategoryId) nextParams.set('categoryId', nextCategoryId);
    if (nextProvinceCode) nextParams.set('provinceCode', nextProvinceCode);
    if (nextMinPrice) nextParams.set('minPrice', nextMinPrice);
    if (nextMaxPrice) nextParams.set('maxPrice', nextMaxPrice);
    if (nextSort && nextSort !== 'relevant') nextParams.set('sort', nextSort);
    if (nextPage > 1) nextParams.set('page', String(nextPage));

    setSearchParams(nextParams);
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    updateSearchParams({
      provinceCode: draftProvinceCode,
      minPrice: sanitizePositiveNumber(draftMinPrice),
      maxPrice: sanitizePositiveNumber(draftMaxPrice),
      sort: activeSort,
      page: 1,
    });
  };

  const clearFilters = () => {
    setDraftProvinceCode('');
    setDraftMinPrice('');
    setDraftMaxPrice('');

    updateSearchParams({
      categoryId: '',
      provinceCode: '',
      minPrice: '',
      maxPrice: '',
      sort: activeSort,
      page: 1,
    });
  };

  const activeFilterChips = [];

  if (activeCategory) {
    activeFilterChips.push({
      key: 'category',
      label: `Danh mục: ${activeCategory.displayName || activeCategory.name}`,
      onRemove: () => updateSearchParams({ categoryId: '', page: 1 }),
    });
  }

  if (activeProvinceCode) {
    const activeProvinceName = provinces.find(
      (province) => String(province.code) === String(activeProvinceCode),
    )?.name || activeProvinceCode;
    activeFilterChips.push({
      key: 'province',
      label: `Khu vực: ${activeProvinceName}`,
      onRemove: () => updateSearchParams({ provinceCode: '', page: 1 }),
    });
  }

  if (activeMinPrice || activeMaxPrice) {
    activeFilterChips.push({
      key: 'price',
      label: `Giá: ${activeMinPrice ? formatVnd(activeMinPrice) : '0đ'} - ${activeMaxPrice ? formatVnd(activeMaxPrice) : 'Không giới hạn'}`,
      onRemove: () => updateSearchParams({ minPrice: '', maxPrice: '', page: 1 }),
    });
  }

  const headline = activeQuery
    ? `Kết quả cho “${activeQuery}”`
    : activeCategory
      ? activeCategory.displayName || activeCategory.name
      : 'Tất cả sản phẩm';

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
    <main className="sr-page">
      <div className="sr-container">
        <div className="sr-content">
          <aside className="sr-sidebar">
            <div className="sr-side-block">
              <h3 className="sr-side-heading"><Menu size={16} /> Tất cả danh mục</h3>
              <ul className="sr-cat-list">
                <li>
                  <button
                    type="button"
                    className={!activeCategoryId ? 'active' : ''}
                    onClick={() => updateSearchParams({ categoryId: '', page: 1 })}
                  >
                    Tất cả sản phẩm
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      className={String(activeCategoryId) === String(category.id) ? 'active' : ''}
                      onClick={() => updateSearchParams({ categoryId: String(category.id), page: 1 })}
                    >
                      {category.displayName || category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sr-side-block">
              <h3 className="sr-side-heading"><SlidersHorizontal size={15} /> Bộ lọc tìm kiếm</h3>
              <form className="sr-filter-form" onSubmit={handleApplyFilters}>
                <label className="sr-field">
                  <span>Khu vực</span>
                  <select
                    value={draftProvinceCode}
                    onChange={(event) => setDraftProvinceCode(event.target.value)}
                    disabled={provinces.length === 0}
                  >
                    <option value="">Toàn quốc</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>{province.name}</option>
                    ))}
                  </select>
                </label>

                <div className="sr-field">
                  <span>Khoảng giá</span>
                  <div className="sr-price-row">
                    <input
                      type="number"
                      min="0"
                      value={draftMinPrice}
                      onChange={(event) => setDraftMinPrice(event.target.value)}
                      placeholder="₫ TỪ"
                    />
                    <i />
                    <input
                      type="number"
                      min="0"
                      value={draftMaxPrice}
                      onChange={(event) => setDraftMaxPrice(event.target.value)}
                      placeholder="₫ ĐẾN"
                    />
                  </div>
                </div>

                <button type="submit" className="sr-apply-btn">Áp dụng</button>
                <button type="button" className="sr-clear-btn" onClick={clearFilters}>Xóa tất cả</button>
              </form>
            </div>
          </aside>

          <section className="sr-main">
            <div className="sr-headline">
              <h1>{headline}</h1>
              <span>{processedProducts.length} sản phẩm</span>
            </div>

            <div className="sr-filter-bar">
              <span className="sr-filter-bar-label">Sắp xếp theo</span>

              {SORT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={activeTabSort === tab.value ? 'sr-sort-btn active' : 'sr-sort-btn'}
                  onClick={() => updateSearchParams({ sort: tab.value, page: 1 })}
                >
                  {tab.label}
                </button>
              ))}

              <label className="sr-price-sort">
                <select
                  value={activePriceSort}
                  onChange={(event) => updateSearchParams({ sort: event.target.value || 'relevant', page: 1 })}
                  aria-label="Sắp xếp theo giá"
                >
                  {PRICE_SORT_OPTIONS.map((option) => (
                    <option key={option.value || 'default'} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronRight size={14} />
              </label>

              <div className="sr-page-mini">
                <span><b>{currentPage}</b>/{totalPages}</span>
                <div className="sr-page-mini-ctrl">
                  <button type="button" disabled={currentPage <= 1} onClick={() => updateSearchParams({ page: currentPage - 1 })} aria-label="Trang trước">
                    <ChevronLeft size={16} />
                  </button>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => updateSearchParams({ page: currentPage + 1 })} aria-label="Trang sau">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {activeFilterChips.length > 0 ? (
              <div className="sr-chips" aria-label="Bộ lọc đang áp dụng">
                {activeFilterChips.map((chip) => (
                  <button type="button" key={chip.key} className="sr-chip" onClick={chip.onRemove} aria-label={`Bỏ lọc ${chip.label}`}>
                    <span>{chip.label}</span>
                    <X size={13} aria-hidden="true" />
                  </button>
                ))}
                <button type="button" className="sr-chip-clear" onClick={clearFilters}>Xóa tất cả</button>
              </div>
            ) : null}

            {error ? <div className="sr-alert"><p>{error}</p></div> : null}

            {loading ? (
              <div className="sr-grid">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="sr-skeleton" />
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="sr-empty">
                <p>Không tìm thấy sản phẩm phù hợp</p>
                <button type="button" onClick={clearFilters}>Xóa tất cả bộ lọc</button>
              </div>
            ) : (
              <>
                <div className="sr-grid">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <ul className="sr-pagination">
                  <li>
                    <button type="button" disabled={currentPage <= 1} onClick={() => updateSearchParams({ page: currentPage - 1 })} aria-label="Trang trước">
                      <ChevronLeft size={16} />
                    </button>
                  </li>
                  {pageNumbers.map((number, index) => (
                    <li key={`${number}-${index}`}>
                      {number === '…' ? (
                        <span className="sr-pagination-gap">…</span>
                      ) : (
                        <button
                          type="button"
                          className={number === currentPage ? 'active' : ''}
                          onClick={() => updateSearchParams({ page: number })}
                        >
                          {number}
                        </button>
                      )}
                    </li>
                  ))}
                  <li>
                    <button type="button" disabled={currentPage >= totalPages} onClick={() => updateSearchParams({ page: currentPage + 1 })} aria-label="Trang sau">
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

export default SearchResults;
