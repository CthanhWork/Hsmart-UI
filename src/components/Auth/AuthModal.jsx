import { useState } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { apiRegister } from '../../services/api';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        await apiRegister({
          username: formData.username,
          password: formData.password,
          email: formData.email,
        });
      }
      await login(formData.username, formData.password);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose} aria-label="Close authentication dialog">
          <X size={20} />
        </button>

        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Join H-smart'}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to manage your intelligent appliance ecosystem.'
            : 'Create an account to access verified pre-owned appliances.'}
        </p>

        {error ? <div className="auth-error" role="alert">{error}</div> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username">{isLogin ? 'USERNAME OR EMAIL' : 'USERNAME'}</label>
            <input
              id="auth-username"
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="form-input bg-gray"
            />
          </div>

          {!isLogin ? (
            <div className="form-group">
              <label htmlFor="auth-email">EMAIL</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input bg-gray"
              />
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="auth-password">PASSWORD</label>
            <input
              id="auth-password"
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="form-input bg-gray"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setIsLogin((current) => !current);
              setError('');
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
