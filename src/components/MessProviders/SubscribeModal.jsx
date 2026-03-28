import { useEffect, useState } from "react";
import { createPayment, createSubscriptionCheckout, getMySubscriptions, verifyPayment } from "../../api/client";
import StarRating from "../common/StarRating";
import "./SubscribeModal.css";

function formatDisplayDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

function SubscribeModal({ auth, provider, isOpen, onClose, onSubscribeSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [switchWarningOpen, setSwitchWarningOpen] = useState(false);
  const [sameMessWarningOpen, setSameMessWarningOpen] = useState(false);
  const [lastSameMessWarningKey, setLastSameMessWarningKey] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMySubscriptions() {
      if (!auth?.token || !isOpen) {
        return;
      }

      try {
        setSubscriptionsLoading(true);
        const data = await getMySubscriptions(auth.token);
        if (!cancelled) {
          setMySubscriptions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load subscriptions:", err);
        }
      } finally {
        if (!cancelled) {
          setSubscriptionsLoading(false);
        }
      }
    }

    loadMySubscriptions();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, isOpen]);
  const providerId = provider?.provider_id;
  const toPriceNumber = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const weeklyPrice = toPriceNumber(provider?.weekly_price);
  const monthlyPrice = toPriceNumber(provider?.monthly_price);

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
  const overlappingSubscriptions = startDate
    ? mySubscriptions.filter(
        (subscription) =>
          (subscription.status || "").toLowerCase() === "active" &&
          String(subscription.end_date || "") >= startDate,
      )
    : [];
  const sameProviderConflict = providerId == null
    ? null
    : overlappingSubscriptions.find(
        (subscription) => Number(subscription.provider_id) === Number(providerId),
      );
  const otherProviderConflicts = providerId == null
    ? []
    : overlappingSubscriptions.filter(
        (subscription) => Number(subscription.provider_id) !== Number(providerId),
      );
  const conflictingMessNames = otherProviderConflicts.map((subscription) => subscription.customer_name).join(", ");
  const sameProviderConflictKey = sameProviderConflict && providerId != null
    ? `${providerId}-${sameProviderConflict.end_date}-${startDate}`
    : "";

  useEffect(() => {
    if (!isOpen) {
      setSameMessWarningOpen(false);
      setLastSameMessWarningKey("");
      return;
    }

    if (!sameProviderConflictKey) {
      setSameMessWarningOpen(false);
      setLastSameMessWarningKey("");
      return;
    }

    if (sameProviderConflictKey !== lastSameMessWarningKey) {
      setSameMessWarningOpen(true);
      setLastSameMessWarningKey(sameProviderConflictKey);
    }
  }, [isOpen, lastSameMessWarningKey, sameProviderConflictKey]);

  if (!isOpen || !provider) return null;

  const completeSubscription = async () => {
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
      setSwitchWarningOpen(false);
      onSubscribeSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

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

    if (sameProviderConflict) {
      setSameMessWarningOpen(true);
      return;
    }

    if (otherProviderConflicts.length > 0) {
      setSwitchWarningOpen(true);
      return;
    }

    await completeSubscription();
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
              {subscriptionsLoading && <small>Checking your active subscriptions...</small>}
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
            <p><strong>Rating:</strong> <StarRating value={provider.rating} size="sm" showValue /></p>
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
              disabled={loading || subscriptionsLoading || !selectedPrice || selectedPrice <= 0 || Boolean(sameProviderConflict)}
            >
              {loading ? "Processing..." : `Pay & Subscribe - ₹${selectedPrice.toFixed(2)}`}
            </button>
          </div>
        </form>

        {switchWarningOpen && (
          <div className="subscribe-confirm-overlay" onClick={() => setSwitchWarningOpen(false)}>
            <div className="subscribe-confirm-dialog" onClick={(event) => event.stopPropagation()}>
              <h3>Active Subscription Found</h3>
              <p>
                You are already subscribed to <strong>{conflictingMessNames}</strong>.
              </p>
              <p>
                Do you want to continue with <strong>{provider.mess_name}</strong>?
              </p>
              <div className="subscribe-confirm-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setSwitchWarningOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={completeSubscription}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}

        {sameMessWarningOpen && sameProviderConflict && (
          <div className="subscribe-confirm-overlay" onClick={() => setSameMessWarningOpen(false)}>
            <div className="subscribe-confirm-dialog subscribe-confirm-dialog--blocked" onClick={(event) => event.stopPropagation()}>
              <div className="subscribe-confirm-header">
                <h3>Already Subscribed</h3>
                <button
                  type="button"
                  className="subscribe-confirm-close"
                  onClick={() => setSameMessWarningOpen(false)}
                  aria-label="Close warning"
                >
                  ×
                </button>
              </div>
              <p>
                You already have an active subscription for <strong>{provider.mess_name}</strong>.
              </p>
              <p>
                Active till <strong>{formatDisplayDate(sameProviderConflict.end_date)}</strong>.
              </p>
              <div className="subscribe-confirm-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setSameMessWarningOpen(false)}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubscribeModal;
