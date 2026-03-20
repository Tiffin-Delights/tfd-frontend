import { useState, useEffect } from "react";
import { getProviderSubscriptions } from "../../api/client";
import "./SubscribersModal.css";

function SubscribersModal({ auth, isOpen, onClose }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && auth?.token) {
      fetchSubscribers();
    }
  }, [isOpen, auth?.token]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviderSubscriptions(auth.token);
      setSubscribers(data);
    } catch (err) {
      setError(err.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeCount = subscribers.filter(
    (s) => (s.status || "").toLowerCase() === "active"
  ).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content subscribers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Manage Subscribers</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading">Loading subscribers...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="subscribers-summary">
              <div className="summary-item">
                <span className="label">Total Subscribers:</span>
                <span className="value">{subscribers.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Active Now:</span>
                <span className="value active">{activeCount}</span>
              </div>
            </div>

            {subscribers.length === 0 ? (
              <div className="empty-state">No subscribers yet</div>
            ) : (
              <div className="subscribers-list">
                {subscribers.map((sub) => (
                  <div key={sub.subscription_id} className="subscriber-card">
                    <div className="subscriber-header">
                      <div>
                        <h4>{sub.customer_name || `Customer #${sub.user_id}`}</h4>
                        <p className="customer-id">Customer #{sub.user_id}</p>
                      </div>
                      <span className={`status-badge ${(sub.status || "").toLowerCase()}`}>
                        {(sub.status || "").toUpperCase()}
                      </span>
                    </div>
                    <div className="subscriber-details">
                      <div className="detail-row">
                        <span>Plan Type:</span>
                        <strong>{sub.plan_type}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Duration:</span>
                        <strong>{sub.duration_days ?? "-"} days</strong>
                      </div>
                      <div className="detail-row">
                        <span>Start Date:</span>
                        <strong>{new Date(sub.start_date).toLocaleDateString()}</strong>
                      </div>
                      <div className="detail-row">
                        <span>End Date:</span>
                        <strong>{new Date(sub.end_date).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SubscribersModal;
