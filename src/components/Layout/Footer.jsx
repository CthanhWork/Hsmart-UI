import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="hsmart-footer">
    <div className="uk-container footer-content-container">
      <div className="footer-brand-side">
        <Link to="/" className="footer-logo">
          <span className="brand-mark" aria-hidden="true">H</span>
          <span>H-Smart</span>
        </Link>
        <p className="footer-tagline">Nền tảng mua bán đồ gia dụng đã kiểm duyệt cho người bán địa phương.</p>
      </div>

      <div className="footer-links-side">
        <nav className="footer-nav" aria-label="Điều hướng chân trang">
          <Link to="/" className="footer-link">Chợ đồ gia dụng</Link>
          <Link to="/sell" className="footer-link">Đăng bán</Link>
          <Link to="/listings" className="footer-link">Tin đăng</Link>
          <Link to="/orders" className="footer-link">Đơn hàng</Link>
          <Link to="/profile" className="footer-link">Hồ sơ</Link>
        </nav>
        <div className="footer-meta-row">
          <span>© {new Date().getFullYear()} H-Smart. Mọi quyền được bảo lưu.</span>
          <span className="footer-separator" aria-hidden="true" />
          <a href="/privacy" className="footer-link">Quyền riêng tư</a>
          <a href="/terms" className="footer-link">Điều khoản</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
