import "./Footer.css";
import { useEffect, useRef, useState } from "react";

function Footer() {
  const footerRef = useRef(null);
  const lastY = useRef(typeof window !== "undefined" ? window.scrollY : 0);
  const [stuck, setStuck] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (!footerRef.current) return;
      const rect = footerRef.current.getBoundingClientRect();

      // If footer top is within or above the viewport bottom, consider it reached
      const reached = rect.top <= window.innerHeight;
      setStuck(reached);

      const currentY = window.scrollY;

      // show only when we are at the bottom and moving downwards / resting
      if (reached) {
        if (currentY > lastY.current) {
          setVisible(true);
        } else if (currentY < lastY.current) {
          setVisible(false);
        }
      } else {
        setVisible(false);
      }
      lastY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // run once to initialize
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer
      ref={footerRef}
      className={`footer ${stuck ? "stuck" : ""} ${stuck ? (visible ? "visible" : "hidden") : ""}`}>
      <div className="footer-container">
        {/* Logo Section */}
       

        {/* About Section */}
        <div className="footer-section">
          
        </div>

        {/* Logo Ideas Section */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Tiffin Delight</h4>
          <ul className="footer-links">
            
          </ul>
        </div>

        {/* Support Section */}
        <div className="footer-section">
          <h4 className="footer-subtitle">Support</h4>
          <ul className="footer-links">
            <li><a href="#help">Help Center</a></li>
            <li><a href="mailto:support@myfreelogomaker.com">support@myfreelogomaker.com</a></li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; 2024 My Free Logo Maker. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
