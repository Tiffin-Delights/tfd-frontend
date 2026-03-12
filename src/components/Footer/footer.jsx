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
            Experience the taste of home with our daily tiffin service.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#menu">Today's Menu</a></li>
            <li><a href="#plans">Meal Plans</a></li>
            <li><a href="#testimonials">Reviews</a></li>
          </ul>
        </div>

        {/* Services */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Our Services</h4>
          <ul className="footer-links">
            <li><a href="#delivery">Home Delivery</a></li>
            <li><a href="#subscription">Meal Subscriptions</a></li>
            <li><a href="#custom">Custom Meal Plans</a></li>
            <li><a href="#bulk">Bulk Orders</a></li>
            <li><a href="#catering">Event Catering</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Get in Touch</h4>
          <ul className="footer-links">
            <li>📞 +91 98765 43210</li>
            <li>📧 hello@tiffindelight.com</li>
            <li>📍 Koramangala, Bangalore</li>
            <li>🕐 7 AM - 10 PM Daily</li>
          </ul>
          <div className="footer-social">
            <span>Follow Us:</span>
            <a href="#instagram">📷</a>
            <a href="#whatsapp">💬</a>
            <a href="#facebook">📘</a>
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
