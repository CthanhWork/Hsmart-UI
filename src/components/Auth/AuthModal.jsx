import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { apiRegister } from '../../services/api';
import { X } from 'lucide-react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
        onClose();
      } else {
        await apiRegister(formData.username, formData.password, formData.email);
        // Switch to login after successful register
        setIsLogin(true);
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
      }
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Join H-smart'}</h2>
        <p className="auth-subtitle">
          {isLogin 
            ? 'Sign in to manage your intelligent appliance ecosystem.' 
            : 'Create an account to access verified pre-owned appliances.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>USERNAME</label>
            <input 
              type="text" 
              name="username" 
              required 
              value={formData.username} 
              onChange={handleChange} 
              className="form-input bg-gray"
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label>EMAIL</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange} 
                className="form-input bg-gray"
              />
            </div>
          )}

          <div className="form-group">
            <label>PASSWORD</label>
            <input 
              type="password" 
              name="password" 
              required 
              value={formData.password} 
              onChange={handleChange} 
              className="form-input bg-gray"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
