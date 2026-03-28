import { useState, useEffect } from "react";
import { apiRequest } from "../../api/client";
import "./SubscriptionPricingModal.css";

function SubscriptionPricingModal({ auth, isOpen, onClose, onUpdateSuccess, onPricingUpdated }) {
  const [pricing, setPricing] = useState({
    weekly_price: "",
    monthly_price: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = auth?.token;

  useEffect(() => {
    if (!isOpen || !token) {
      return undefined;
    }

    let cancelled = false;

    async function loadPricingOnOpen() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest("/providers/pricing", {
          token,
        });
        if (!cancelled && response) {
          setPricing({
            weekly_price: response.weekly_price || "",
            monthly_price: response.monthly_price || ""
          });
        }
      } catch (err) {
        console.error("Failed to load pricing:", err);
        if (!cancelled) {
          setError("Could not load current pricing");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPricingOnOpen();

    return () => {
      cancelled = true;
    };
  }, [isOpen, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPricing((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!pricing.weekly_price || !pricing.monthly_price) {
      setError("Please enter both weekly and monthly prices");
      return;
    }

    if (parseFloat(pricing.weekly_price) <= 0 || parseFloat(pricing.monthly_price) <= 0) {
      setError("Prices must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest("/providers/pricing", {
        method: "PUT",
        token,
        body: {
          weekly_price: parseFloat(pricing.weekly_price),
          monthly_price: parseFloat(pricing.monthly_price)
        }
      });

      setSuccess(true);
      onPricingUpdated?.({
        weekly_price: parseFloat(pricing.weekly_price),
        monthly_price: parseFloat(pricing.monthly_price)
      });
      setTimeout(() => {
        onUpdateSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to update pricing");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Subscription Pricing</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading-message">Loading pricing...</div>
        ) : (
          <>
            {success && (
              <div className="success-message">
                ✓ Pricing updated successfully!
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="pricing-form">
              <div className="pricing-info">
                <p>Set the prices for your weekly and monthly subscription plans. These prices will be displayed to customers.</p>
              </div>

              <div className="form-group">
                <label htmlFor="weekly_price">Weekly Subscription Price (₹) *</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    id="weekly_price"
                    name="weekly_price"
                    value={pricing.weekly_price}
                    onChange={handleChange}
                    placeholder="e.g., 899"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <small>Price for 7-day subscription</small>
              </div>

              <div className="form-group">
                <label htmlFor="monthly_price">Monthly Subscription Price (₹) *</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    id="monthly_price"
                    name="monthly_price"
                    value={pricing.monthly_price}
                    onChange={handleChange}
                    placeholder="e.g., 3299"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <small>Price for 30-day subscription</small>
              </div>

              <div className="pricing-summary">
                <h4>Price Summary</h4>
                <div className="summary-row">
                  <span>Weekly (7 days):</span>
                  <span className="price">₹ {pricing.weekly_price || "0"}</span>
                </div>
                <div className="summary-row">
                  <span>Monthly (30 days):</span>
                  <span className="price">₹ {pricing.monthly_price || "0"}</span>
                </div>
                {pricing.weekly_price && pricing.monthly_price && (
                  <div className="summary-row discount">
                    <span>Monthly Advantage:</span>
                    <span className="value">
                      ₹ {(parseFloat(pricing.monthly_price) - (parseFloat(pricing.weekly_price) * 4.28)).toFixed(0)} saved
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting || loading}
              >
                {submitting ? "Updating..." : "💾 Update Pricing"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default SubscriptionPricingModal;
