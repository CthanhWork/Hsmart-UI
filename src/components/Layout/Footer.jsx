import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer-content">
      <strong>H-Smart</strong>
      <nav><Link to="/">Marketplace</Link><Link to="/sell">Sell a product</Link></nav>
      <span>Backend-connected marketplace interface</span>
    </div>
  </footer>
);

export default Footer;
