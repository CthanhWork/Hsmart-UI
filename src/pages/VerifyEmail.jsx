import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import OtpCodeField from '../components/Auth/OtpCodeField';
import { apiResendVerification, apiVerifyEmail } from '../services/api';
import './AuthAction.css';

const sanitizeOtp = (value = '') => value.replace(/\D/g, '').slice(0, 6);
const isOtpCode = (value = '') => /^\d{6}$/.test(value.trim());

const VerifyEmail = () => {
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
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const verifyToken = async (nextToken) => {
    const normalizedToken = usesLegacyToken ? nextToken.trim() : sanitizeOtp(nextToken);

    if (!usesLegacyToken && normalizedToken.length !== 6) {
      setStatus({ type: 'error', message: 'Vui lòng nhập đầy đủ mã OTP 6 số từ email.' });
      return;
    }

    if (usesLegacyToken && !normalizedToken) {
      setStatus({ type: 'error', message: 'Vui lòng thử lại bằng link xác minh cũ hoặc yêu cầu email mới.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setVerifying(true);

    try {
      await apiVerifyEmail(normalizedToken);
      setStatus({
        type: 'success',
        message: 'Email đã được xác minh thành công. Bây giờ bạn có thể quay lại đăng nhập.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Không thể xác minh mã OTP lúc này. Vui lòng thử lại.',
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!usesLegacyToken || !initialTokenParam) {
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setStatus({ type: '', message: '' });
      setVerifying(true);

      try {
        await apiVerifyEmail(initialTokenParam);
        setStatus({
          type: 'success',
          message: 'Email đã được xác minh thành công. Bây giờ bạn có thể quay lại đăng nhập.',
        });
      } catch (error) {
        setStatus({
          type: 'error',
          message: error.message || 'Không thể xác minh token cũ lúc này. Vui lòng thử lại.',
        });
      } finally {
        setVerifying(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialTokenParam, usesLegacyToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyToken(token);
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Nhập email đã đăng ký để gửi lại mã OTP.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setResending(true);

    try {
      await apiResendVerification(email.trim());
      setStatus({
        type: 'success',
        message: 'Đã gửi lại email chứa mã OTP. Hãy kiểm tra cả hộp thư spam nếu chưa thấy.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Chưa thể gửi lại email xác minh. Vui lòng thử lại.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="auth-action-page">
      <div className="auth-action-shell">
        <div className="auth-action-hero">
          <div className="auth-action-hero-copy">
            <div className="auth-action-badge">
              <ShieldCheck size={14} />
              Xác minh tài khoản
            </div>
            <h1>{usesLegacyToken ? 'Đang xử lý link xác minh cũ cho bạn.' : 'Nhập mã OTP để kích hoạt tài khoản nhanh gọn hơn.'}</h1>
            <p>
              {usesLegacyToken
                ? 'Liên kết cũ vẫn được hỗ trợ. Nếu bạn muốn trải nghiệm gọn hơn, hãy yêu cầu gửi lại email mới để nhận mã OTP 6 số.'
                : 'Chúng tôi không bắt bạn phải bấm vào link nữa. Chỉ cần mở email, lấy mã OTP 6 số và nhập vào form bên cạnh.'}
            </p>

            <div className="auth-action-tips">
              <div className="auth-action-tip">
                <CheckCircle2 size={18} />
                <span>{usesLegacyToken ? 'Nếu link cũ không ổn định, hãy xin gửi lại email mới.' : 'Mở email đăng ký để lấy mã OTP 6 số.'}</span>
              </div>
              <div className="auth-action-tip">
                <Mail size={18} />
                <span>Nếu chưa thấy email, bạn có thể gửi lại mã ngay tại đây.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-action-card">
          <header>
            <h2>Xác minh email bằng OTP</h2>
            <p>Nhập mã OTP 6 số trong email để kích hoạt tài khoản.</p>
          </header>

          {status.message ? (
            <div className={`auth-action-status ${status.type || 'success'}`}>{status.message}</div>
          ) : null}

          <form className="auth-action-form" onSubmit={handleSubmit}>
            {usesLegacyToken ? (
              <div className="auth-action-field">
                <label htmlFor="verify-token">Token từ link cũ</label>
                <input
                  id="verify-token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  disabled={verifying}
                  autoComplete="one-time-code"
                />
                <small>Phiên bản email cũ vẫn được hỗ trợ. Bạn có thể yêu cầu gửi lại email mới để dùng OTP 6 số.</small>
              </div>
            ) : (
              <OtpCodeField
                idPrefix="verify-otp"
                label="Mã OTP"
                value={sanitizeOtp(token)}
                onChange={setToken}
                disabled={verifying}
                autoFocus={!initialToken}
                helperText="Bạn có thể paste cả mã OTP, hệ thống sẽ tự điền vào 6 ô."
              />
            )}

            <div className="auth-action-actions">
              <button type="submit" className="btn btn-primary" disabled={verifying}>
                {verifying ? 'Đang xác minh...' : 'Xác minh ngay'}
              </button>
            </div>
          </form>

          <div className="auth-action-secondary">
            <div className="auth-action-field">
              <label htmlFor="verify-email">Chưa nhận được email?</label>
              <input
                id="verify-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập email đã đăng ký"
                autoComplete="email"
              />
            </div>

            <div className="auth-action-inline">
              <button type="button" className="btn btn-secondary" onClick={handleResend} disabled={resending}>
                {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
              </button>
              <Link className="auth-action-text-button" to="/">
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerifyEmail;
