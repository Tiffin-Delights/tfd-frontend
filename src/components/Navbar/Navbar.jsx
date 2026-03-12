import "./Navbar.css";
import loginIcon from "../../assets/Nav/login-icon.png";
import logo from "../../assets/Nav/logo.png";
import { useState } from "react";

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
          <img src={loginIcon} alt="Login" className="login-icon" />
          <button className="login-btn">Log In</button>

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
