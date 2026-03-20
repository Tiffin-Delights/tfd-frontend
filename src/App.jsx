import { useEffect, useState } from "react";
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

  const handleBackToHome = () => {
    setShowProvidersPage(false);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = dietTheme;
    try {
      localStorage.setItem("tfd_diet_theme", dietTheme);
    } catch {
      // ignore storage write issues
    }
  }, [dietTheme]);

  return (
    <>
      <MyNavbar
        onLoginSuccess={handleLoginSuccess}
        auth={auth}
        setAuth={setAuth}
        dietTheme={dietTheme}
        onThemeToggle={() => setDietTheme((current) => (current === "veg" ? "nonveg" : "veg"))}
      />
      <main className="page">
        {auth?.user?.role === "provider" ? (
          <ProviderDashboard auth={auth} />
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
              <button className="btn ghost" onClick={handleBackToHome}>
                Logout
              </button>
            </div>
            {showCustomerDashboard ? (
              <CustomerDashboard auth={auth} refreshKey={customerDashboardRefreshKey} />
            ) : (
              <MessProviders
                auth={auth}
                onSubscriptionCreated={() => {
                  setCustomerDashboardRefreshKey((prev) => prev + 1);
                  setShowCustomerDashboard(true);
                }}
              />
            )}
          </>
        ) : (
          <>
            <Hero dietTheme={dietTheme} />
            <About />
            {/* <Plans /> */}
            <HowItWorks dietTheme={dietTheme} />
            <Menu />
            <Testimonials />
            <FAQ />
          </>
        )}
      </main>
    </>
  );
}

export default App;
