import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetchCategories, apiFetchProductById, apiUpdateProduct } from '../services/api';
import './Operations.css';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', price: '', categoryId: '', status: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetchProductById(id), apiFetchCategories()])
      .then(([product, categoryData]) => {
        setCategories(categoryData);
        setForm({
          title: product.title,
          description: product.description,
          price: String(product.price),
          categoryId: String(product.categoryId || ''),
          status: product.status === 'SOLD' ? 'SOLD' : '',
        });
      })
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== 'status' || value) body.append(key, value);
    });
    try {
      await apiUpdateProduct(id, body);
      navigate('/listings');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header"><div><p className="eyebrow">Seller</p><h1>Edit listing</h1><p>Update the fields supported by product-service.</p></div></header>
      <section className="surface">
        <form className="form-grid" onSubmit={submit}>
          <label>Product name<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Price (VND)<input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">Uncategorized</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.displayName || category.name}</option>)}
          </select></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="">Keep current status</option><option value="SOLD">Mark as sold</option>
          </select></label>
          <label className="full-field">Description<textarea rows="7" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {error ? <div className="feedback feedback-error">{error}</div> : null}
          <div className="form-actions"><button className="btn btn-primary"><Save size={16} /> Save listing</button></div>
        </form>
      </section>
    </div>
  );
};

export default ProductEdit;
