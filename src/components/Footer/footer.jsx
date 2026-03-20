import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <div className="footer-logo">
            <h3 className="footer-title">🍱 Tiffin Delight</h3>
            <p className="footer-tagline">Khaooo! Ghar Jaisa</p>
          </div>
          <p className="footer-description">
            Fresh, homemade meals delivered to your doorstep.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#plans">Meal Plans</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; 2024 Tiffin Delight. All rights reserved. • Made with ❤️ for food lovers</p>
      </div>
    </footer>
  );
}

export default Footer;
