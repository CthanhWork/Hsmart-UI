import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiResendVerification, apiVerifyEmail } from '../services/api';
import './AuthAction.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const verifyToken = async (nextToken) => {
    if (!nextToken.trim()) {
      setStatus({ type: 'error', message: 'Vui lòng nhập mã xác minh hoặc mở đúng link từ email.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setVerifying(true);

    try {
      await apiVerifyEmail(nextToken.trim());
      setStatus({
        type: 'success',
        message: 'Email đã được xác minh thành công. Bây giờ bạn có thể quay lại đăng nhập.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Không thể xác minh email lúc này. Vui lòng thử lại.',
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!initialToken) return;
    const timer = window.setTimeout(() => {
      verifyToken(initialToken);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await verifyToken(token);
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Nhập email đã đăng ký để gửi lại link xác minh.' });
      return;
    }

    setStatus({ type: '', message: '' });
    setResending(true);

    try {
      await apiResendVerification(email.trim());
      setStatus({
        type: 'success',
        message: 'Đã gửi lại email xác minh. Hãy kiểm tra cả hộp thư spam nếu chưa thấy.',
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
            <h1>Kích hoạt tài khoản để đăng nhập và giao dịch.</h1>
            <p>
              Nếu bạn mở từ email thì hệ thống sẽ tự xác minh. Nếu không, bạn vẫn có thể dán mã
              xác minh vào form bên cạnh.
            </p>

            <div className="auth-action-tips">
              <div className="auth-action-tip">
                <CheckCircle2 size={18} />
                <span>Mở email đăng ký để lấy link hoặc mã xác minh.</span>
              </div>
              <div className="auth-action-tip">
                <Mail size={18} />
                <span>Nếu chưa thấy email, bạn có thể gửi lại ngay tại đây.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-action-card">
          <header>
            <h2>Xác minh email</h2>
            <p>Nhập mã xác minh nếu bạn không muốn mở link trong email.</p>
          </header>

          {status.message ? (
            <div className={`auth-action-status ${status.type || 'success'}`}>{status.message}</div>
          ) : null}

          <form className="auth-action-form" onSubmit={handleSubmit}>
            <div className="auth-action-field">
              <label htmlFor="verify-token">Mã xác minh / token</label>
              <input
                id="verify-token"
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Dán mã từ email vào đây"
                autoComplete="one-time-code"
              />
              <small>Một số email chứa link bấm trực tiếp, một số trường hợp bạn có thể copy mã thủ công.</small>
            </div>

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
                {resending ? 'Đang gửi lại...' : 'Gửi lại email xác minh'}
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
