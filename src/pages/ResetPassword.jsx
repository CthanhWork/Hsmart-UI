import { useMemo, useState } from 'react';
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiResetPassword } from '../services/api';
import './AuthAction.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập token đặt lại mật khẩu từ email.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Mật khẩu mới cần tối thiểu 8 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Mật khẩu xác nhận chưa khớp.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setSubmitting(true);

    try {
      await apiResetPassword(token.trim(), newPassword);
      setStatus({
        type: 'success',
        message: 'Đặt lại mật khẩu thành công. Bạn có thể quay lại và đăng nhập bằng mật khẩu mới.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-action-page">
      <div className="auth-action-shell">
        <div className="auth-action-hero">
          <div className="auth-action-hero-copy">
            <div className="auth-action-badge">
              <MailCheck size={14} />
              Khôi phục tài khoản
            </div>
            <h1>Tạo mật khẩu mới để quay lại H-Smart.</h1>
            <p>
              Nếu bạn mở từ email, token sẽ tự điền sẵn. Nếu không, chỉ cần dán token trong email
              rồi nhập mật khẩu mới.
            </p>

            <div className="auth-action-tips">
              <div className="auth-action-tip">
                <KeyRound size={18} />
                <span>Đặt mật khẩu tối thiểu 8 ký tự để đăng nhập ổn định hơn.</span>
              </div>
              <div className="auth-action-tip">
                <ShieldCheck size={18} />
                <span>Sau khi đổi xong, bạn có thể đăng nhập lại ngay trên trang chủ.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-action-card">
          <header>
            <h2>Đặt lại mật khẩu</h2>
            <p>Nhập token từ email và tạo mật khẩu mới cho tài khoản của bạn.</p>
          </header>

          {status.message ? (
            <div className={`auth-action-status ${status.type || 'success'}`}>{status.message}</div>
          ) : null}

          <form className="auth-action-form" onSubmit={handleSubmit}>
            <div className="auth-action-field">
              <label htmlFor="reset-token">Token đặt lại</label>
              <input
                id="reset-token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Dán token từ email"
                autoComplete="one-time-code"
              />
            </div>

            <div className="auth-action-field">
              <label htmlFor="reset-password">Mật khẩu mới</label>
              <input
                id="reset-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
              />
            </div>

            <div className="auth-action-field">
              <label htmlFor="reset-confirm-password">Xác nhận mật khẩu mới</label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </div>

            <div className="auth-action-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </form>

          <div className="auth-action-secondary">
            <Link className="auth-action-text-button" to="/">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
