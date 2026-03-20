import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import OrdersModal from "./OrdersModal";
import SubscribersModal from "./SubscribersModal";
import FeedbackModal from "./FeedbackModal";
import MenuUploadModal from "./MenuUploadModal";
import SubscriptionPricingModal from "./SubscriptionPricingModal";
import "./ProviderDashboard.css";

function ProviderDashboard({ auth }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const profileDataRef = useRef(null);

  useEffect(() => {
    profileDataRef.current = profileData;
  }, [profileData]);

  const fetchProviderProfile = useCallback(async ({ background = false } = {}) => {
    if (!auth?.token) {
      return;
    }

    const hasExistingProfile = Boolean(profileDataRef.current);

    try {
      // Show full-screen loading only for the very first load.
      if (!background && !hasExistingProfile) {
        setLoading(true);
      }

      if (!background || !hasExistingProfile) {
        setError(null);
      }

      const response = await apiRequest("/providers/profile", {
        token: auth?.token,
      });
      setProfileData(response);
    } catch (err) {
      if (!background || !hasExistingProfile) {
        setError(err.message || "Failed to load provider profile");
      }
      console.error("Provider profile error:", err);
    } finally {
      if (!background && !hasExistingProfile) {
        setLoading(false);
      }
    }
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) {
      return;
    }

    fetchProviderProfile();

    const interval = setInterval(() => {
      fetchProviderProfile({ background: true });
    }, 15000);

    const handleWindowFocus = () => fetchProviderProfile({ background: true });
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [auth?.token, fetchProviderProfile]);

  if (loading) {
    return (
      <div className="provider-dashboard">
        <div className="loading-message">Loading provider profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="provider-dashboard">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="provider-dashboard">
        <div className="error-message">No provider profile found</div>
      </div>
    );
  }

  const { active_customers, total_orders, menu_items_count } = profileData;

  return (
    <div className="provider-dashboard">
      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Provider Dashboard</h1>
          <p className="provider-name">{profileData.mess_name}</p>
        </div>

        {/* Provider Info Card */}
        <div className="provider-info-card">
          <div className="info-section">
            <h3>Business Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Business Name</label>
                <p>{profileData.mess_name}</p>
              </div>
              <div className="info-item">
                <label>Owner Name</label>
                <p>{profileData.owner_name}</p>
              </div>
              <div className="info-item">
                <label>City</label>
                <p>{profileData.city}</p>
              </div>
              <div className="info-item">
                <label>Contact</label>
                <p>{profileData.contact}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{auth?.user?.email}</p>
              </div>
              <div className="info-item">
                <label>Rating</label>
                <p className="rating-badge">⭐ {profileData.rating || "No ratings yet"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{active_customers}</div>
            <div className="stat-label">Active Customers</div>
            <div className="stat-description">Currently taking your service</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{total_orders}</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-description">Orders received</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{menu_items_count}</div>
            <div className="stat-label">Menu Items</div>
            <div className="stat-description">Items in your menu</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn primary" onClick={() => setActiveModal("menu")}>Upload Menu Items</button>
            <button className="action-btn primary" onClick={() => setActiveModal("pricing")}>💰 Set Pricing</button>
            <button className="action-btn secondary" onClick={() => setActiveModal("orders")}>View Orders</button>
            <button className="action-btn secondary" onClick={() => setActiveModal("subscribers")}>Manage Subscribers</button>
            <button className="action-btn secondary" onClick={() => setActiveModal("feedback")}>View Feedback</button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Service Overview</h3>
          <div className="activity-content">
            <p>
              You have <strong>{active_customers}</strong> active customers taking your tiffin service.
            </p>
            <p>
              Total orders received: <strong>{total_orders}</strong>
            </p>
            <p>
              Your menu currently has <strong>{menu_items_count}</strong> items.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <OrdersModal 
        auth={auth} 
        isOpen={activeModal === "orders"} 
        onClose={() => setActiveModal(null)} 
      />
      <SubscribersModal 
        auth={auth} 
        isOpen={activeModal === "subscribers"} 
        onClose={() => setActiveModal(null)} 
      />
      <FeedbackModal 
        auth={auth} 
        isOpen={activeModal === "feedback"} 
        onClose={() => setActiveModal(null)} 
      />
      <MenuUploadModal 
        auth={auth} 
        providerId={profileData?.provider_id}
        isOpen={activeModal === "menu"} 
        onClose={() => setActiveModal(null)}
        onUploadSuccess={() => setActiveModal(null)}
      />
      <SubscriptionPricingModal 
        auth={auth} 
        isOpen={activeModal === "pricing"} 
        onClose={() => setActiveModal(null)}
        onUpdateSuccess={() => setActiveModal(null)}
        onPricingUpdated={(newPricing) => {
          // Pricing was updated, any component listening can refresh
          window.dispatchEvent(new CustomEvent('pricingUpdated', { detail: newPricing }));
        }}
      />
    </div>
  );
}

export default ProviderDashboard;
