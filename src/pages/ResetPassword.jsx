import { useMemo, useState } from 'react';
import { KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import OtpCodeField from '../components/Auth/OtpCodeField';
import { apiResetPassword } from '../services/api';
import './AuthAction.css';

const sanitizeOtp = (value = '') => value.replace(/\D/g, '').slice(0, 6);
const isOtpCode = (value = '') => /^\d{6}$/.test(value.trim());

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const initialTokenParam = useMemo(
    () => (searchParams.get('token') || searchParams.get('code') || '').trim(),
    [searchParams],
  );
  const usesLegacyToken = useMemo(
    () => Boolean(initialTokenParam) && !isOtpCode(initialTokenParam),
    [initialTokenParam],
  );
  const initialToken = useMemo(
    () => (usesLegacyToken ? initialTokenParam : sanitizeOtp(initialTokenParam)),
    [initialTokenParam, usesLegacyToken],
  );
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedToken = usesLegacyToken ? token.trim() : sanitizeOtp(token);

    if (!usesLegacyToken && normalizedToken.length !== 6) {
      setStatus({ type: 'error', message: 'Vui lòng nhập đầy đủ mã OTP 6 số từ email.' });
      return;
    }

    if (usesLegacyToken && !normalizedToken) {
      setStatus({ type: 'error', message: 'Vui lòng mở lại link đặt lại mật khẩu cũ hoặc yêu cầu email mới.' });
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
      await apiResetPassword(normalizedToken, newPassword);
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
            <h1>{usesLegacyToken ? 'Link đặt lại mật khẩu cũ vẫn đang được hỗ trợ.' : 'Nhập OTP và tạo mật khẩu mới trong cùng một màn hình.'}</h1>
            <p>
              {usesLegacyToken
                ? 'Nếu bạn đang mở email cũ, hệ thống vẫn cho phép nhập token cũ. Nhưng từ bây giờ email mới sẽ dùng mã OTP 6 số gọn hơn.'
                : 'Không cần bấm link dài nữa. Hãy mở email, lấy mã OTP 6 số rồi nhập cùng mật khẩu mới để hoàn tất.'}
            </p>

            <div className="auth-action-tips">
              <div className="auth-action-tip">
                <KeyRound size={18} />
                <span>{usesLegacyToken ? 'Token cũ vẫn hợp lệ nếu email đặt lại mật khẩu đã được gửi từ trước.' : 'Mã OTP được gửi trong email đặt lại mật khẩu của bạn.'}</span>
              </div>
              <div className="auth-action-tip">
                <ShieldCheck size={18} />
                <span>Chọn mật khẩu mới tối thiểu 8 ký tự để đăng nhập ổn định hơn.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-action-card">
          <header>
            <h2>Đặt lại mật khẩu bằng OTP</h2>
            <p>Nhập mã OTP 6 số từ email và tạo mật khẩu mới cho tài khoản của bạn.</p>
          </header>

          {status.message ? (
            <div className={`auth-action-status ${status.type || 'success'}`}>{status.message}</div>
          ) : null}

          <form className="auth-action-form" onSubmit={handleSubmit}>
            {usesLegacyToken ? (
              <div className="auth-action-field">
                <label htmlFor="reset-token">Token từ link cũ</label>
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  disabled={submitting}
                  autoComplete="one-time-code"
                />
                <small>Email mới sẽ dùng mã OTP 6 số, nhưng token cũ vẫn được chấp nhận trong thời gian còn hạn.</small>
              </div>
            ) : (
              <OtpCodeField
                idPrefix="reset-otp"
                label="Mã OTP"
                value={sanitizeOtp(token)}
                onChange={setToken}
                disabled={submitting}
                autoFocus={!initialToken}
                helperText="Nếu bạn paste cả mã, hệ thống sẽ tự chia vào 6 ô."
              />
            )}

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
