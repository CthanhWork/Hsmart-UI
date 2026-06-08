import { useState } from 'react';
import { Save } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { apiUpdateProfile } from '../services/api';
import './Operations.css';

const fields = [
  ['fullName', 'Full name'],
  ['phoneNumber', 'Phone number'],
  ['province', 'Province'],
  ['district', 'District'],
  ['ward', 'Ward'],
  ['streetDetail', 'Street detail'],
  ['avatarUrl', 'Avatar URL'],
];

const Profile = () => {
  const { user, refreshProfile } = useUser();
  const [form, setForm] = useState(
    () => Object.fromEntries(fields.map(([key]) => [key, user?.[key] || ''])),
  );
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await apiUpdateProfile(form);
      await refreshProfile();
      setFeedback('Profile updated successfully.');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="operations-page container narrow-page">
      <header className="operations-header">
        <div><p className="eyebrow">Account</p><h1>Profile</h1><p>Manage identity and delivery address information.</p></div>
      </header>
      <section className="surface">
        <div className="account-summary">
          <div className="avatar">{(user?.username || 'U').slice(0, 1).toUpperCase()}</div>
          <div><strong>{user?.username}</strong><p>{user?.email}</p></div>
          <span className="role-badge">{user?.role}</span>
        </div>
        <dl className="fact-list compact">
          <div><dt>Trust score</dt><dd>{Number(user?.trustScore || 0).toFixed(1)}</dd></div>
          <div><dt>Seller reviews</dt><dd>{user?.reviewCount || 0}</dd></div>
        </dl>
        <form className="form-grid" onSubmit={save}>
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={form[key] || ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </label>
          ))}
          {error ? <div className="feedback feedback-error">{error}</div> : null}
          {feedback ? <div className="feedback feedback-success">{feedback}</div> : null}
          <div className="form-actions"><button className="btn btn-primary"><Save size={16} /> Save profile</button></div>
        </form>
      </section>
    </div>
  );
};

export default Profile;
