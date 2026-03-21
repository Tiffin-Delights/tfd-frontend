import "./Footer.css";

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        {/* Company Info */}
        <div className="footer-section">
          <div className="footer-logo">
            <h3 className="footer-title">🍱 Tiffin Delight</h3>
            <p className="footer-tagline">Khaooo! Ghar Jaisa</p>
          </div>
          <p className="footer-description">
            Fresh meal plans for students, offices, and busy homes.
          </p>
        </div>
        <div className="footer-section quick-links">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#menu">Highlights</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-section footer-contact-section">
          <h4 className="footer-subtitle">Contact</h4>
          <div className="footer-contact">
            <p><strong>Call:</strong> <a href="tel:+919876543210">+91 98765 43210</a></p>
            <p><strong>Email:</strong> <a href="mailto:hello@tiffindelight.in">hello@tiffindelight.in</a></p>
            <p><strong>Visit:</strong> HSR Layout, Bengaluru</p>
          </div>
          <div className="footer-social">
            <span>Follow us</span>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">💼</a>
          </div>
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
