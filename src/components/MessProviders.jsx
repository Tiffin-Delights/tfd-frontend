import { useCallback, useEffect, useMemo, useState } from "react";
import "./MessProviders.css";
import { getProviderMenu, listProviders } from "../api/client";
import SubscribeModal from "./MessProviders/SubscribeModal";

function MenuList({ title, items }) {
  return (
    <div className="menu-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MessProviders({ auth, onSubscriptionCreated }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [subscribeModal, setSubscribeModal] = useState(false);
  const [selectedForSubscribe, setSelectedForSubscribe] = useState(null);

  const loadProviders = useCallback(async () => {
    if (!auth?.token) {
      setProviders([]);
      return;
    }
    setProvidersLoading(true);
    setProvidersError("");
    try {
      const data = await listProviders(auth.token);
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      setProvidersError(error?.message || "Unable to load providers");
    } finally {
      setProvidersLoading(false);
    }
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) {
      setProviders([]);
      setSelectedProvider(null);
      return;
    }

    loadProviders();

    const handlePricingUpdated = () => loadProviders();
    const handleWindowFocus = () => loadProviders();
    window.addEventListener("pricingUpdated", handlePricingUpdated);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("pricingUpdated", handlePricingUpdated);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [auth?.token, loadProviders]);

  useEffect(() => {
    if (!selectedProvider || !auth?.token) {
      setMenuItems([]);
      setMenuError("");
      return;
    }

    const loadMenu = async () => {
      setMenuLoading(true);
      setMenuError("");
      try {
        const data = await getProviderMenu(auth.token, selectedProvider.provider_id);
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setMenuError(error?.message || "Unable to load menu");
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenu();
  }, [auth?.token, selectedProvider]);

  const groupedMenu = useMemo(() => {
    const grouped = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    };

    menuItems.forEach((item) => {
      const day = String(item.day || "").slice(0, 3).toUpperCase();
      const dishes = Array.isArray(item.dishes) ? item.dishes.join(", ") : "Menu not available";
      const line = `${day}: ${dishes}`;
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(line);
      }
    });

    return grouped;
  }, [menuItems]);

  return (
    <section className="mess-providers" id="mess-providers">
      <div className="section-head">
        <p className="eyebrow">Mess Providers</p>
        <h2>Choose Your Mess</h2>
        <p className="lede">
          Click on Details to see the full menu of any mess provider.
        </p>
      </div>

      {!selectedProvider && (
        <div className="provider-grid">
          {providersLoading && <p className="providers-state">Loading providers...</p>}
          {!providersLoading && providersError && <p className="providers-state providers-state--error">{providersError}</p>}
          {!providersLoading && !providersError && providers.length === 0 && (
            <p className="providers-state">No providers found in database.</p>
          )}

          {providers.map((provider) => (
            <article className="provider-card" key={provider.provider_id}>
              <h3>{provider.mess_name}</h3>
              <p>
                <strong>Location:</strong> {provider.city}
              </p>
              <p>
                <strong>Rating:</strong> {provider.rating}
              </p>
              <p>
                <strong>Contact:</strong> {provider.contact}
              </p>
              <div className="pricing-info">
                {provider.weekly_price > 0 && (
                  <p><strong>Weekly:</strong> ₹{provider.weekly_price}/week</p>
                )}
                {provider.monthly_price > 0 && (
                  <p><strong>Monthly:</strong> ₹{provider.monthly_price}/month</p>
                )}
              </div>
              <div className="card-actions">
                <button
                  className="btn primary"
                  onClick={() => setSelectedProvider(provider)}
                >
                  Details
                </button>
                <button
                  className="btn secondary"
                  onClick={() => {
                    setSelectedForSubscribe(provider);
                    setSubscribeModal(true);
                  }}
                  disabled={auth?.user?.role !== "customer"}
                  title={auth?.user?.role !== "customer" ? "Customers only" : "Subscribe to this plan"}
                >
                  Subscribe
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedProvider && (
        <div className="menu-details">
          <button
            className="btn ghost back-btn"
            onClick={() => setSelectedProvider(null)}
          >
            Back to all providers
          </button>

          <h3>{selectedProvider.mess_name} - Full Menu</h3>

          {menuLoading && <p className="providers-state">Loading menu...</p>}
          {!menuLoading && menuError && <p className="providers-state providers-state--error">{menuError}</p>}

          {!menuLoading && !menuError && (
            <div className="menu-grid">
              <MenuList title="Breakfast" items={groupedMenu.breakfast.length ? groupedMenu.breakfast : ["No breakfast menu available"]} />
              <MenuList title="Lunch" items={groupedMenu.lunch.length ? groupedMenu.lunch : ["No lunch menu available"]} />
              <MenuList title="Snacks" items={groupedMenu.snacks.length ? groupedMenu.snacks : ["No snacks menu available"]} />
              <MenuList title="Dinner" items={groupedMenu.dinner.length ? groupedMenu.dinner : ["No dinner menu available"]} />
            </div>
          )}
        </div>
      )}

      {/* Subscribe Modal */}
      <SubscribeModal
        auth={auth}
        provider={selectedForSubscribe}
        isOpen={subscribeModal}
        onClose={() => {
          setSubscribeModal(false);
          setSelectedForSubscribe(null);
        }}
        onSubscribeSuccess={() => {
          setSubscribeModal(false);
          setSelectedForSubscribe(null);
          loadProviders();
          window.dispatchEvent(new CustomEvent("subscriptionCreated"));
          onSubscriptionCreated?.();
        }}
      />
    </section>
  );
}

export default MessProviders;
