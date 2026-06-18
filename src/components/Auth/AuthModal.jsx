import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import LocationFields from '../common/LocationFields';
import { useUser } from '../../context/UserContext';
import { apiForgotPassword, apiRegister } from '../../services/api';
import './AuthModal.css';

const emptyRegisterForm = {
  username: '',
  password: '',
  email: '',
  fullName: '',
  phoneNumber: '',
  provinceCode: '',
  districtCode: '',
  wardCode: '',
  streetDetail: '',
};

const modeContent = {
  login: {
    title: 'Đăng nhập',
    submit: 'Đăng nhập',
  },
  register: {
    title: 'Đăng ký',
    submit: 'Tạo tài khoản',
  },
  forgot: {
    title: 'Đặt lại mật khẩu',
    submit: 'Gửi email đặt lại',
  },
};

const AuthModal = ({ isOpen, onClose }) => {
  const { login } = useUser();
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState(emptyRegisterForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) {
    return null;
  }

  const content = modeContent[mode];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await apiRegister({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          provinceCode: formData.provinceCode,
          districtCode: formData.districtCode,
          wardCode: formData.wardCode,
          streetDetail: formData.streetDetail,
        });
        setSuccess('Tài khoản đã được tạo. Vui lòng kiểm tra email để xác minh trước khi đăng nhập.');
        setMode('login');
        setFormData((current) => ({
          ...emptyRegisterForm,
          username: current.username,
          email: current.email,
        }));
        return;
      }

      if (mode === 'forgot') {
        await apiForgotPassword(formData.email);
        setSuccess('Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi.');
        setMode('login');
        return;
      }

      await login(formData.username, formData.password);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'Không thể hoàn tất xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" role="presentation">
      <div className={`auth-modal auth-modal-${mode}`} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="auth-close" onClick={onClose} aria-label="Đóng hộp thoại xác thực">
          <X size={20} />
        </button>

        <div className="auth-shell">
          <aside className="auth-brand-panel" aria-hidden="true">
            <div className="auth-brand-mark">
              <img src="/hsmart-logo.svg" alt="" />
            </div>
          </aside>

          <div className="auth-content-panel">
            {mode !== 'forgot' ? (
              <div className="auth-mode-switcher" aria-label="Chọn chế độ xác thực">
                <button
                  type="button"
                  className={mode === 'login' ? 'active' : ''}
                  onClick={() => switchMode('login')}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className={mode === 'register' ? 'active' : ''}
                  onClick={() => switchMode('register')}
                >
                  Đăng ký
                </button>
              </div>
            ) : null}

            <header className="auth-header">
              <h2 className="auth-title" id="auth-modal-title">{content.title}</h2>
            </header>

            {error ? <div className="auth-error" role="alert">{error}</div> : null}
            {success ? <div className="auth-success" role="status">{success}</div> : null}

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' ? (
                <>
                  <section className="auth-form-section">
                    <div className="auth-section-heading">
                      <h3>Tài khoản</h3>
                    </div>
                    <div className="auth-field-grid">
                      <div className="form-group">
                        <label htmlFor="auth-username">Tên đăng nhập</label>
                        <input
                          id="auth-username"
                          type="text"
                          name="username"
                          required
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="auth-email">Email</label>
                        <input
                          id="auth-email"
                          type="email"
                          name="email"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group auth-password-group auth-field-full">
                        <label htmlFor="auth-password">Mật khẩu</label>
                        <div className="auth-password-control">
                          <input
                            id="auth-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                          />
                          <button
                            type="button"
                            className="auth-password-toggle"
                            onClick={() => setShowPassword((current) => !current)}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="auth-form-section">
                    <div className="auth-section-heading">
                      <h3>Thông tin cá nhân</h3>
                    </div>
                    <div className="auth-field-grid">
                      <div className="form-group">
                        <label htmlFor="auth-full-name">Họ và tên</label>
                        <input
                          id="auth-full-name"
                          type="text"
                          name="fullName"
                          autoComplete="name"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="auth-phone">Số điện thoại</label>
                        <input
                          id="auth-phone"
                          type="tel"
                          name="phoneNumber"
                          autoComplete="tel"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="auth-form-section">
                    <div className="auth-section-heading">
                      <h3>Địa chỉ giao nhận</h3>
                    </div>
                    <div className="auth-location-grid">
                      <LocationFields formData={formData} setFormData={setFormData} prefix="auth-register" />
                      <div className="form-group auth-address-detail">
                        <label htmlFor="auth-street-detail">Địa chỉ chi tiết</label>
                        <input
                          id="auth-street-detail"
                          type="text"
                          name="streetDetail"
                          autoComplete="street-address"
                          value={formData.streetDetail}
                          onChange={handleChange}
                          className="form-input"
                          placeholder="Số nhà, tên đường, tòa nhà..."
                        />
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  {mode !== 'forgot' ? (
                    <div className="form-group">
                      <label htmlFor="auth-username">Tên đăng nhập hoặc email</label>
                      <input
                        id="auth-username"
                        type="text"
                        name="username"
                        required
                        autoComplete="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  ) : null}

                  {mode === 'forgot' ? (
                    <div className="form-group">
                      <label htmlFor="auth-email">Email</label>
                      <input
                        id="auth-email"
                        type="email"
                        name="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  ) : null}

                  {mode !== 'forgot' ? (
                    <div className="form-group auth-password-group">
                      <label htmlFor="auth-password">Mật khẩu</label>
                      <div className="auth-password-control">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          minLength={8}
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                          className="form-input"
                        />
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : content.submit}
              </button>
            </form>

            <div className="auth-footer">
              {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button
                type="button"
                className="auth-switch"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
              </button>
              {mode === 'login' ? (
                <>
                  <span className="auth-footer-dot" aria-hidden="true">·</span>
                  <button type="button" className="auth-switch" onClick={() => switchMode('forgot')}>
                    Quên mật khẩu
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
