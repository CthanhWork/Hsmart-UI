import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import LocationFields from '../components/common/LocationFields';
import { useUser } from '../context/UserContext';
import { apiUpdateProfile } from '../services/api';
import './Operations.css';

const buildProfileForm = (user) => ({
  fullName: user?.fullName || '',
  phoneNumber: user?.phoneNumber || '',
  provinceCode: user?.provinceCode || '',
  districtCode: user?.districtCode || '',
  wardCode: user?.wardCode || '',
  streetDetail: user?.streetDetail || '',
  avatarUrl: user?.avatarUrl || '',
});

const Profile = () => {
  const { user, refreshProfile } = useUser();
  const userForm = useMemo(() => buildProfileForm(user), [user]);
  const [form, setForm] = useState(userForm);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setSaving(true);

    try {
      await apiUpdateProfile(form);
      await refreshProfile();
      setFeedback('Đã cập nhật hồ sơ thành công.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header">
        <div>
          <h1>Hồ sơ</h1>
        </div>
      </header>

      <section className="surface">
        <div className="account-summary">
          <div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{user?.username}</strong>
            <p>{user?.email}</p>
          </div>
          <span className="role-badge">{user?.role}</span>
        </div>

        <dl className="fact-list compact">
          <div>
            <dt>Điểm uy tín</dt>
            <dd>{Number(user?.trustScore || 0).toFixed(1)}</dd>
          </div>
          <div>
            <dt>Đánh giá người bán</dt>
            <dd>{user?.reviewCount || 0}</dd>
          </div>
        </dl>

        <form className="form-grid" onSubmit={save}>
          <label>
            Họ và tên
            <input name="fullName" value={form.fullName} onChange={handleChange} />
          </label>

          <label>
            Số điện thoại
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
          </label>

          <LocationFields formData={form} setFormData={setForm} prefix="profile" />

          <label className="full-field">
            Địa chỉ chi tiết
            <input
              name="streetDetail"
              value={form.streetDetail}
              onChange={handleChange}
              placeholder="Số nhà, tên đường, tòa nhà..."
            />
          </label>

          <label className="full-field">
            URL ảnh đại diện
            <input
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </label>

          {error ? <div className="feedback feedback-error">{error}</div> : null}
          {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}

          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving}>
              <Save size={16} />
              {saving ? ' Đang lưu...' : ' Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Profile;
