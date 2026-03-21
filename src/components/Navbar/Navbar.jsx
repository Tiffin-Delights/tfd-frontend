import "./Navbar.css";
import loginIcon from "../../assets/Nav/login-icon.png";
import logo from "../../assets/Nav/logo.png";
import { useState, useEffect } from "react";
import LoginFlow from "../Auth/LoginFlow";

function MyNavbar({
  onLoginSuccess,
  auth: parentAuth,
  setAuth: setParentAuth,
  dietTheme,
  onThemeToggle,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [auth, setAuth] = useState(parentAuth);

  useEffect(() => {
    setAuth(parentAuth);
  }, [parentAuth]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tfd_auth");
      const stored = raw ? JSON.parse(raw) : null;
      if (!parentAuth) {
        setAuth(stored);
      }
    } catch {
      setAuth(null);
    }
  }, [parentAuth]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("tfd_auth");
    setAuth(null);
    if (setParentAuth) {
      setParentAuth(null);
    }
    window.location.href = "/";
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
          {!auth?.token && (
            <>
              <li><a href="#home" onClick={closeMenu}>Home</a></li>
              <li><a href="#about" onClick={closeMenu}>About Us</a></li>
              <li><a href="#menu" onClick={closeMenu}>Highlights</a></li>
              <li><a href="#contact" onClick={closeMenu}>Contact Us</a></li>
            </>
          )}
          <li className="diet-toggle-item">
            <button
              type="button"
              className={`diet-toggle ${dietTheme === "veg" ? "is-veg" : "is-nonveg"}`}
              onClick={onThemeToggle}
              aria-label={`Switch to ${dietTheme === "veg" ? "non-veg" : "veg"} theme`}
              aria-pressed={dietTheme === "veg"}
            >
              <span className="diet-toggle__label diet-toggle__label--left">Non-Veg</span>
              <span className="diet-toggle__track" aria-hidden="true">
                <span className="diet-toggle__thumb" />
              </span>
              <span className="diet-toggle__label diet-toggle__label--right">Veg</span>
            </button>
          </li>
        </ul>

        {/* Right Actions */}
        <div className="nav-right">
          {auth?.token ? (
            <div className="auth-section">
              <span className="user-info">{auth?.user?.role === "provider" ? "Welcome" : "Welcome"} : {auth?.user?.name}</span>
              <button
                className="login-btn logout-btn"
                onClick={handleLogout}
                type="button"
                aria-label="Logout"
                data-tooltip="Log Out"
              >
                <span className="login-btn__border" aria-hidden="true" />
                <span className="login-btn__content">
                  <img src={loginIcon} alt="" className="login-icon" aria-hidden="true" />
                  <span className="login-btn__text">Log Out</span>
                </span>
              </button>
            </div>
          ) : (
            <LoginFlow
              onCustomerLoginSuccess={(result) => {
                const nextAuth = {
                  token: result.access_token,
                  user: result.user,
                };
                setAuth(nextAuth);
                localStorage.setItem("tfd_auth", JSON.stringify(nextAuth));
                if (setParentAuth) {
                  setParentAuth(nextAuth);
                }
                onLoginSuccess(result);
              }}
              onProviderLoginSuccess={(result) => {
                const nextAuth = {
                  token: result.access_token,
                  user: result.user,
                };
                setAuth(nextAuth);
                localStorage.setItem("tfd_auth", JSON.stringify(nextAuth));
                if (setParentAuth) {
                  setParentAuth(nextAuth);
                }
                onLoginSuccess(result);
              }}
            >
              {(openLogin) => (
                <button
                  className="login-btn"
                  onClick={openLogin}
                  type="button"
                  aria-label="Open login options"
                  data-tooltip="Log In"
                >
                  <span className="login-btn__border" aria-hidden="true" />
                  <span className="login-btn__content">
                    <img src={loginIcon} alt="" className="login-icon" aria-hidden="true" />
                    <span className="login-btn__text">Log In</span>
                  </span>
                </button>
              )}
            </LoginFlow>
          )}

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
