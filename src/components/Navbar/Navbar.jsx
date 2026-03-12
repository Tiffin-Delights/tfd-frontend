import "./Navbar.css";
import loginIcon from "../../assets/Nav/login-icon.png";
import logo from "../../assets/Nav/logo.png";
import { useState } from "react";
import LoginFlow from "../Auth/LoginFlow";

function MyNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <nav className="navbar">
        {/* Logo */}
        <div className="nav-left">
          <img src={logo} alt="TB" className="logo" />
          {/* <span className="brand-name">Tiffin Delight</span> */}
        </div>

        {/* Center Menu */}
        <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          <li><a href="#home" onClick={closeMenu}>Home</a></li>
          <li><a href="#about" onClick={closeMenu}>About Us</a></li>
          <li><a href="#plans" onClick={closeMenu}>Your Tiffin</a></li>
          <li><a href="#contact" onClick={closeMenu}>Contact Us</a></li>
        </ul>

        {/* Right Actions */}
        <div className="nav-right">
          <LoginFlow>
            {(openLogin) => (
              <button
                className="login-btn"
                onClick={openLogin}
                type="button"
                aria-label="Open login options"
              >
                <span className="login-btn__border" aria-hidden="true" />
                <span className="login-btn__content">
                  <img src={loginIcon} alt="" className="login-icon" aria-hidden="true" />
                  <span className="login-btn__text">Log In</span>
                </span>
              </button>
            )}
          </LoginFlow>

          {/* Hamburger Menu */}
          <div className={`hamburger ${isMenuOpen ? "active" : ""}`} onClick={toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default MyNavbar;
