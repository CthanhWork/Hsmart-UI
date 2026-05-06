import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <h2 className="footer-logo">H-smart</h2>
          <p className="footer-desc">
            Setting the new standard for pre-owned household appliances through intelligent verification and transparent data.
          </p>
        </div>
        
        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>MARKETPLACE</h4>
            <a href="#">Featured</a>
            <a href="#">Verification Process</a>
            <a href="#">Sell your Tech</a>
          </div>
          <div className="footer-column">
            <h4>SUPPORT</h4>
            <a href="#">Help Center</a>
            <a href="#">Buyer Protection</a>
            <a href="#">Sustainability</a>
          </div>
          <div className="footer-column newsletter-col">
            <h4>INTELLIGENCE UPDATES</h4>
            <div className="newsletter-input">
              <input type="email" placeholder="Email address" />
              <button className="btn btn-primary">Join</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container footer-bottom">
        <p>© 2024 H-SMART SYSTEMS. ALL RIGHTS RESERVED.</p>
        <div className="footer-legal">
          <a href="#">PRIVACY PROTOCOL</a>
          <a href="#">TERMS OF SYNC</a>
          <a href="#">COOKIE POLICY</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
