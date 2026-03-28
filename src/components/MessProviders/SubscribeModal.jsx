import { useState } from "react";
import { createPayment, createSubscriptionCheckout, verifyPayment } from "../../api/client";
import "./SubscribeModal.css";

function SubscribeModal({ auth, provider, isOpen, onClose, onSubscribeSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);

  if (!isOpen || !provider) return null;

  const toPriceNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const weeklyPrice = toPriceNumber(provider.weekly_price);
  const monthlyPrice = toPriceNumber(provider.monthly_price);

  const calculateEndDate = (start, plan) => {
    if (!start) return "";
    const date = new Date(start);
    if (plan === "weekly") {
      date.setDate(date.getDate() + 6); // 7 days total
    } else {
      date.setDate(date.getDate() + 29); // 30 days total
    }
    return date.toISOString().split("T")[0];
  };

  const endDate = calculateEndDate(startDate, selectedPlan);
  const selectedPrice = selectedPlan === "weekly" ? weeklyPrice : monthlyPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!startDate) {
      setError("Please select a start date");
      return;
    }

    if (!selectedPrice || selectedPrice <= 0) {
      setError("Provider has not set pricing for this plan yet");
      return;
    }

    try {
      setLoading(true);
      const checkout = await createSubscriptionCheckout(auth?.token, {
        provider_id: provider.provider_id,
        plan_type: selectedPlan,
        start_date: startDate,
      });

      const paymentIntent = await createPayment(auth?.token, {
        order_id: checkout.order_id,
        payment_gateway: "tfd_direct",
      });

      await verifyPayment(auth?.token, {
        order_id: checkout.order_id,
        amount: paymentIntent.amount,
        status: "paid",
        transaction_id: paymentIntent.transaction_id,
        payment_gateway: "tfd_direct",
      });

      setPaymentSummary(checkout);

      onSubscribeSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const getMinStartDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content subscribe-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Subscribe to {provider.mess_name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Plan Selection */}
          <div className="plan-selection">
            <h3>Choose Your Plan</h3>
            <div className="plan-options">
              <label className={`plan-option ${selectedPlan === "weekly" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="weekly"
                  checked={selectedPlan === "weekly"}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                />
                <div className="plan-content">
                  <div className="plan-name">Weekly Plan</div>
                  <div className="plan-price">₹{weeklyPrice.toFixed(2)}</div>
                  <div className="plan-duration">7 days of meals</div>
                  {!weeklyPrice || weeklyPrice <= 0 ? (
                    <div className="plan-status unavailable">Not available</div>
                  ) : (
                    <div className="plan-status available">Available</div>
                  )}
                </div>
              </label>

              <label className={`plan-option ${selectedPlan === "monthly" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="monthly"
                  checked={selectedPlan === "monthly"}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                />
                <div className="plan-content">
                  <div className="plan-name">Monthly Plan</div>
                  <div className="plan-price">₹{monthlyPrice.toFixed(2)}</div>
                  <div className="plan-duration">30 days of meals</div>
                  {!monthlyPrice || monthlyPrice <= 0 ? (
                    <div className="plan-status unavailable">Not available</div>
                  ) : (
                    <div className="plan-status available">Available</div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Date Selection */}
          <div className="date-selection">
            <h3>When Would You Like to Start?</h3>
            <div className="form-group">
              <label htmlFor="start_date">Start Date *</label>
              <input
                type="date"
                id="start_date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={getMinStartDate()}
                required
              />
              <small>Must be tomorrow or later</small>
            </div>
          </div>

          {/* Summary */}
          {startDate && (
            <div className="subscription-summary">
              <h3>Subscription Summary</h3>
              <div className="summary-item">
                <span>Plan:</span>
                <strong>{selectedPlan.toUpperCase()}</strong>
              </div>
              <div className="summary-item">
                <span>Provider:</span>
                <strong>{provider.mess_name}</strong>
              </div>
              <div className="summary-item">
                <span>Start Date:</span>
                <strong>{new Date(startDate).toLocaleDateString()}</strong>
              </div>
              <div className="summary-item">
                <span>End Date:</span>
                <strong>{new Date(endDate).toLocaleDateString()}</strong>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <strong>{selectedPlan === "weekly" ? "7 days" : "30 days"}</strong>
              </div>
              <div className="summary-item total">
                <span>Base Price:</span>
                <strong>₹{selectedPrice.toFixed(2)}</strong>
              </div>
              {paymentSummary?.wallet_balance_used > 0 && (
                <div className="summary-item">
                  <span>Wallet Discount:</span>
                  <strong>- ₹{Number(paymentSummary.wallet_balance_used).toFixed(2)}</strong>
                </div>
              )}
              {paymentSummary?.payable_amount != null && (
                <div className="summary-item total">
                  <span>Payable Now:</span>
                  <strong>₹{Number(paymentSummary.payable_amount).toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Provider Info */}
          <div className="provider-info">
            <p><strong>Location:</strong> {provider.city}</p>
            <p><strong>Service Address:</strong> {provider.service_address_text || "Not available"}</p>
            <p><strong>Delivery Radius:</strong> {provider.service_radius_km ? `${provider.service_radius_km} km` : "Not available"}</p>
            {provider.distance_km != null && <p><strong>Distance from you:</strong> {provider.distance_km} km</p>}
            <p><strong>Rating:</strong> ⭐ {provider.rating || "No ratings yet"}</p>
            <p><strong>Contact:</strong> {provider.contact}</p>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading || !selectedPrice || selectedPrice <= 0}
            >
              {loading ? "Processing..." : `Pay & Subscribe - ₹${selectedPrice.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubscribeModal;
