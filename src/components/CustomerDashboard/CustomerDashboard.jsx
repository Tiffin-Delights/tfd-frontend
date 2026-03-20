import { useCallback, useEffect, useState } from "react";
import { apiRequest, getMySubscriptions } from "../../api/client";
import "./CustomerDashboard.css";

function CustomerDashboard({ auth, refreshKey = 0 }) {
  const [profile, setProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const profileResponse = await apiRequest("/users/profile", {
        token: auth?.token,
      });
      setProfile(profileResponse);

      const subsResponse = await getMySubscriptions(auth?.token);
      setSubscriptions(Array.isArray(subsResponse) ? subsResponse : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      console.error("Customer dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [auth?.token]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const handleSubscriptionCreated = () => fetchData();
    window.addEventListener("subscriptionCreated", handleSubscriptionCreated);
    return () => {
      window.removeEventListener("subscriptionCreated", handleSubscriptionCreated);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="customer-dashboard">
        <div className="loading-message">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-dashboard">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="customer-dashboard">
        <div className="error-message">No profile found</div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active"
  );
  const inactiveSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "active"
  );

  return (
    <div className="customer-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <p className="customer-name">Welcome, {profile.name}! 👋</p>
        </div>

        {/* Customer Info Card */}
        <div className="customer-info-card">
          <div className="info-section">
            <h3>Profile Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{profile.name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>{profile.phone || "Not provided"}</p>
              </div>
              <div className="info-item">
                <label>Location</label>
                <p>{profile.location || "Not provided"}</p>
              </div>
              <div className="info-item">
                <label>Delivery Address</label>
                <p>{profile.delivery_address || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions Summary */}
        <div className="subscriptions-summary">
          <div className="summary-card">
            <div className="summary-number">{activeSubscriptions.length}</div>
            <div className="summary-label">Active Subscriptions</div>
            <div className="summary-desc">Currently subscribed to</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{subscriptions.length}</div>
            <div className="summary-label">Total Plans</div>
            <div className="summary-desc">All your subscriptions</div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="subscriptions-section">
          <h2>📋 Your Active Subscriptions</h2>
          {activeSubscriptions.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any active subscriptions yet.</p>
              <p className="hint">Visit the Mess Providers section to find and subscribe to a meal plan.</p>
            </div>
          ) : (
            <div className="subscriptions-grid">
              {activeSubscriptions.map((sub) => (
                <div key={sub.subscription_id} className="subscription-card active">
                  <div className="card-header">
                    <h3>{sub.customer_name}</h3>
                    <span className="status-badge active">ACTIVE</span>
                  </div>
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="label">Plan Type:</span>
                      <span className="value">{(sub.plan_type || "").toUpperCase()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Start Date:</span>
                      <span className="value">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">End Date:</span>
                      <span className="value">
                        {new Date(sub.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Duration:</span>
                      <span className="value">{sub.duration_days || "-"} days</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Started:</span>
                      <span className="value">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn pause">Pause Plan</button>
                    <button className="action-btn cancel">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inactive Subscriptions */}
        {inactiveSubscriptions.length > 0 && (
          <div className="subscriptions-section">
            <h2>📭 Paused & Past Subscriptions</h2>
            <div className="subscriptions-grid">
              {inactiveSubscriptions.map((sub) => (
                <div key={sub.subscription_id} className="subscription-card inactive">
                  <div className="card-header">
                    <h3>{sub.customer_name}</h3>
                    <span className={`status-badge ${(sub.status || "").toLowerCase()}`}>
                      {(sub.status || "").toUpperCase()}
                    </span>
                  </div>
                  <div className="card-details">
                    <div className="detail-row">
                      <span className="label">Plan Type:</span>
                      <span className="value">{(sub.plan_type || "").toUpperCase()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Start Date:</span>
                      <span className="value">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">End Date:</span>
                      <span className="value">
                        {new Date(sub.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Duration:</span>
                      <span className="value">{sub.duration_days || "-"} days</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn reactivate">Reactivate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - No Subscriptions */}
        {subscriptions.length === 0 && (
          <div className="no-subscriptions">
            <p>Start your first subscription today! 🚀</p>
            <p>Browse mess providers and choose a meal plan that fits your lifestyle.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
