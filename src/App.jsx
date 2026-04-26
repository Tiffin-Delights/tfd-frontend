import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import MyNavbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/footer";
import Hero from "./components/Hero";
import About from "./components/About";
import Plans from "./components/Plans";
import HowItWorks from "./components/HowItWorks";
import Menu from "./components/Menu";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import MessProviders from "./components/MessProviders";
import ProviderDashboard from "./components/ProviderDashboard/ProviderDashboard";
import CustomerDashboard from "./components/CustomerDashboard/CustomerDashboard";
import PublicProviderDetails from "./components/PublicProviderDetails";

const AUTO_LOGOUT_AFTER_MS = 3 * 60 * 1000;

function readPublicProviderRoute() {
  if (typeof window === "undefined") {
    return null;
  }

  const match = window.location.pathname.match(/^\/providers\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function App() {
  const [dietTheme, setDietTheme] = useState(() => {
    try {
      return localStorage.getItem("tfd_diet_theme") || "nonveg";
    } catch {
      return "nonveg";
    }
  });
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("tfd_auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [, setShowProvidersPage] = useState(Boolean(auth?.token));
  const [showCustomerDashboard, setShowCustomerDashboard] = useState(false);
  const [customerDashboardRefreshKey, setCustomerDashboardRefreshKey] = useState(0);
  const [publicProviderId, setPublicProviderId] = useState(() =>
    readPublicProviderRoute(),
  );
  const inactivityTimeoutRef = useRef(null);

  const logoutUser = useCallback(() => {
    try {
      localStorage.removeItem("tfd_auth");
    } catch {
      // ignore storage write issues
    }

    setAuth(null);
    setShowProvidersPage(false);
    setShowCustomerDashboard(false);
  }, []);

  const handleLoginSuccess = (loginResult) => {
    if (!loginResult?.access_token || !loginResult?.user) {
      return;
    }

    const nextAuth = {
      token: loginResult.access_token,
      user: loginResult.user,
    };

    setAuth(nextAuth);
    localStorage.setItem("tfd_auth", JSON.stringify(nextAuth));
    setShowProvidersPage(true);
    setShowCustomerDashboard(false);
  };

  const handleAuthUserUpdate = (nextUser) => {
    setAuth((current) => {
      if (!current?.token) {
        return current;
      }

      const nextAuth = {
        ...current,
        user: nextUser,
      };
      localStorage.setItem("tfd_auth", JSON.stringify(nextAuth));
      return nextAuth;
    });
  };

  useEffect(() => {
    document.documentElement.dataset.theme = dietTheme;
    try {
      localStorage.setItem("tfd_diet_theme", dietTheme);
    } catch {
      // ignore storage write issues
    }
  }, [dietTheme]);

  useEffect(() => {
    if (!auth?.token) {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return undefined;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
      }

      inactivityTimeoutRef.current = window.setTimeout(() => {
        logoutUser();
      }, AUTO_LOGOUT_AFTER_MS);
    };

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    resetInactivityTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, true);
    });

    return () => {
      if (inactivityTimeoutRef.current) {
        window.clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer, true);
      });
    };
  }, [auth?.token, logoutUser]);

  useEffect(() => {
    const handlePopState = () => {
      setPublicProviderId(readPublicProviderRoute());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openPublicProviderPage = useCallback((providerId) => {
    window.history.pushState({}, "", `/providers/${providerId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPublicProviderId(providerId);
  }, []);

  const goToHomePage = useCallback(() => {
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPublicProviderId(null);
  }, []);

  return (
    <>
      <MyNavbar
        onLoginSuccess={handleLoginSuccess}
        onLogout={logoutUser}
        auth={auth}
        setAuth={setAuth}
        dietTheme={dietTheme}
        onThemeToggle={() => setDietTheme((current) => (current === "veg" ? "nonveg" : "veg"))}
      />
      <main className="page">
        {auth?.user?.role === "provider" ? (
          <ProviderDashboard auth={auth} onAuthUserUpdate={handleAuthUserUpdate} />
        ) : auth?.token ? (
          <>
            <div className="providers-page-header">
              {showCustomerDashboard ? (
                <button className="btn ghost" onClick={() => setShowCustomerDashboard(false)}>
                  Browse Providers
                </button>
              ) : (
                <button className="btn ghost" onClick={() => setShowCustomerDashboard(true)}>
                  My Subscriptions
                </button>
              )}
            </div>
            {showCustomerDashboard ? (
              <CustomerDashboard auth={auth} refreshKey={customerDashboardRefreshKey} />
            ) : (
              <MessProviders
                auth={auth}
                dietTheme={dietTheme}
                onAuthUserUpdate={handleAuthUserUpdate}
                onSubscriptionCreated={() => {
                  setCustomerDashboardRefreshKey((prev) => prev + 1);
                  setShowCustomerDashboard(true);
                }}
              />
            )}
          </>
        ) : publicProviderId ? (
          <PublicProviderDetails
            providerId={publicProviderId}
            onBack={goToHomePage}
          />
        ) : (
          <>
            <Hero dietTheme={dietTheme} />
            <About />
            {/* <Plans /> */}
            <HowItWorks dietTheme={dietTheme} />
            <Menu />
            <Testimonials
              dietTheme={dietTheme}
              onOpenProvider={openPublicProviderPage}
            />
            <FAQ />
          </>
        )}
      </main>
    </>
  );
}

export default App;
