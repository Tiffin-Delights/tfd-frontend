import "./Navbar.css";
import loginIcon from "../../assets/Nav/login-icon.png";
import logo from "../../assets/Nav/logo.png";
import { useState, useEffect, useRef } from "react";
import LoginFlow from "../Auth/LoginFlow";
import AccountModal from "./AccountModal";

function MyNavbar({
  onLoginSuccess,
  onLogout,
  auth: parentAuth,
  setAuth: setParentAuth,
  dietTheme,
  onThemeToggle,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [auth, setAuth] = useState(parentAuth);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!userMenuRef.current) {
        return;
      }
      if (!userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    try {
      localStorage.removeItem("tfd_auth");
    } catch {
      // ignore storage write issues
    }
    setAuth(null);
    if (setParentAuth) {
      setParentAuth(null);
    }
  };

  const navBasePath =
    !auth?.token && typeof window !== "undefined" && window.location.pathname !== "/"
      ? "/"
      : "";

  return (
    <header className="header">
      <nav className="navbar">
        {/* Logo */}
        <div className="nav-left">
          <a href="/" aria-label="Go to homepage">
            <img src={logo} alt="TB" className="logo" />
          </a>
          {/* <span className="brand-name">Tiffin Delight</span> */}
        </div>

        {/* Center Menu */}
        <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          {!auth?.token && (
            <>
              <li><a href={`${navBasePath}#home`} onClick={closeMenu}>Home</a></li>
              <li><a href={`${navBasePath}#about`} onClick={closeMenu}>About Us</a></li>
              <li><a href={`${navBasePath}#menu`} onClick={closeMenu}>Highlights</a></li>
              <li><a href={`${navBasePath}#contact`} onClick={closeMenu}>Contact Us</a></li>
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
              <div className="user-menu" ref={userMenuRef}>
                <button
                  className="login-btn user-menu-trigger"
                  onClick={() => setShowUserMenu((current) => !current)}
                  type="button"
                  aria-label="Open user menu"
                  aria-expanded={showUserMenu}
                >
                  <span className="login-btn__border" aria-hidden="true" />
                  <span className="login-btn__content">
                    <img src={loginIcon} alt="" className="login-icon" aria-hidden="true" />
                  </span>
                </button>

                {showUserMenu && (
                  <div className="user-menu-dropdown" role="menu" aria-label="User menu">
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAccountModal(true);
                      }}
                    >
                      Change Password
                    </button>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={handleLogout}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
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

      <AccountModal
        auth={auth}
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </header>
  );
}

export default MyNavbar;
