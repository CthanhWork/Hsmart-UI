import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { apiFetchCategories, apiFetchProductPage, apiSearchProducts } from '../services/api';
import './Operations.css';

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
          });
        setProducts(page.content);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [searchParams]);

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
    <div className="operations-page container">
      <header className="operations-header">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Verified household products</h1>
          <p>Browse products approved for sale by H-Smart moderation.</p>
        </div>
      </header>

      <form className="catalog-toolbar" onSubmit={submitSearch}>
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name or description"
            aria-label="Search products"
          />
        </label>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      <div className="category-tabs" aria-label="Product categories">
        <button className={!categoryId ? 'active' : ''} onClick={() => selectCategory('')}>All</button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={String(categoryId) === String(category.id) ? 'active' : ''}
            onClick={() => selectCategory(String(category.id))}
          >
            {category.displayName || category.name}
          </button>
        ))}
      </div>

      {error ? <div className="feedback feedback-error" role="alert">{error}</div> : null}
      {loading ? <div className="page-state">Loading products...</div> : null}
      {!loading && !error && products.length === 0 ? (
        <div className="page-state">No approved products match this search.</div>
      ) : null}

      <div className="product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
};

export default Marketplace;
