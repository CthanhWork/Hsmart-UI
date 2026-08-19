import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { apiFetchCategories, apiFetchProductById, apiUpdateProduct } from '../services/api';
import './Operations.css';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', price: '', categoryId: '', status: '', negotiable: false, minPrice: '',
  });
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
          negotiable: Boolean(product.negotiable),
          minPrice: product.minPrice != null ? String(product.minPrice) : '',
        });
      })
      .catch((requestError) => setError(requestError.message));
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.negotiable) {
      const minPriceValue = Number(form.minPrice);
      if (form.minPrice === '' || minPriceValue <= 0) {
        setError('Giá sàn phải lớn hơn 0 khi cho phép trả giá.');
        return;
      }
      if (minPriceValue >= Number(form.price)) {
        setError('Giá sàn phải nhỏ hơn giá niêm yết.');
        return;
      }
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'status') {
        if (value) body.append(key, value);
        return;
      }
      if (key === 'minPrice') {
        if (form.negotiable && value !== '') body.append(key, value);
        return;
      }
      body.append(key, value);
    });
    try {
      await apiUpdateProduct(id, body);
      toast.success('Cập nhật tin đăng thành công.');
      navigate('/listings');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header">
        <div>
          <h1>Sửa tin đăng</h1>
        </div>
      </header>

      <section className="surface">
        <form className="form-grid" onSubmit={submit}>
          <label>Tên sản phẩm<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>Giá bán (VND)<input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label>Danh mục<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
            <option value="">Chưa phân loại</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.displayName || category.name}</option>)}
          </select></label>
          <label>Trạng thái<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="">Giữ trạng thái hiện tại</option><option value="SOLD">Đánh dấu đã bán</option>
          </select></label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.negotiable}
              onChange={(event) => setForm({
                ...form,
                negotiable: event.target.checked,
                minPrice: event.target.checked ? form.minPrice : '',
              })}
            />
            Cho phép người mua trả giá
          </label>
          {form.negotiable ? (
            <label>Giá sàn (VND)
              <input
                type="number"
                min="0"
                step="1000"
                value={form.minPrice}
                onChange={(event) => setForm({ ...form, minPrice: event.target.value })}
                placeholder="Phải nhỏ hơn giá niêm yết"
              />
            </label>
          ) : null}
          <label className="full-field">Mô tả<textarea rows="7" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {error ? <div className="feedback feedback-error">{error}</div> : null}
          <div className="form-actions"><button className="btn btn-primary"><Save size={16} /> Lưu tin đăng</button></div>
        </form>
      </section>
    </div>
  );
};

export default ProductEdit;
