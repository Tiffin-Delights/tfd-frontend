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

function buildDemoUpiId(providerName, orderId) {
  const normalizedName = String(providerName || "tiffin")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10) || "tiffin";
  return `${normalizedName}.${orderId}@okdemo`;
}

function buildDemoQrPattern(seed) {
  const base = String(seed || "tfd-demo");
  return Array.from({ length: 81 }, (_, index) => {
    const charCode = base.charCodeAt(index % base.length);
    return (charCode + index * 7) % 3 === 0;
  });
}

function SubscribeModal({ auth, provider, isOpen, onClose, onSubscribeSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [pendingCheckout, setPendingCheckout] = useState(null);
  const [paymentStep, setPaymentStep] = useState("form");
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
      setPendingCheckout(null);
      setPaymentSummary(null);
      setPaymentStep("form");
      setError(null);
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

  const finalizeDemoPayment = async (checkout) => {
    try {
      setLoading(true);
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
      setPaymentStep("success");
      setPendingCheckout(null);
      setSwitchWarningOpen(false);
      window.setTimeout(() => {
        onSubscribeSuccess?.();
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || "Failed to confirm demo payment");
      setPaymentStep("demo");
    } finally {
      setLoading(false);
    }
  };

  const completeSubscription = async () => {
    try {
      setLoading(true);
      const checkout = await createSubscriptionCheckout(auth?.token, {
        provider_id: provider.provider_id,
        plan_type: selectedPlan,
        start_date: startDate,
      });

      setPaymentSummary(checkout);
      setSwitchWarningOpen(false);

      if (Number(checkout.payable_amount || 0) <= 0) {
        await finalizeDemoPayment(checkout);
        return;
      }

      setPendingCheckout({
        ...checkout,
        demo_upi_id: buildDemoUpiId(provider.mess_name, checkout.order_id),
        demo_reference: `TFD${String(checkout.order_id).padStart(6, "0")}`,
      });
      setPaymentStep("demo");
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

  const qrPattern = pendingCheckout
    ? buildDemoQrPattern(`${pendingCheckout.order_id}-${pendingCheckout.demo_upi_id}`)
    : [];

  if (paymentStep === "demo" && pendingCheckout) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content subscribe-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Demo Payment</h2>
              <p className="demo-payment-subtitle">Scan the QR or use the demo UPI ID below.</p>
            </div>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="subscribe-modal__body">
            {error && <div className="error-message">{error}</div>}

            <div className="demo-payment-card">
              <div className="demo-qr-shell">
                <div className="demo-qr-corners demo-qr-corners--top-left" />
                <div className="demo-qr-corners demo-qr-corners--top-right" />
                <div className="demo-qr-corners demo-qr-corners--bottom-left" />
                <div className="demo-qr-grid" aria-label="Demo QR code">
                  {qrPattern.map((filled, index) => (
                    <span
                      key={`${pendingCheckout.order_id}-${index}`}
                      className={filled ? "is-filled" : ""}
                    />
                  ))}
                </div>
              </div>

              <div className="demo-payment-meta">
                <div className="demo-payment-pill">Demo Only</div>
                <h3>{provider.mess_name}</h3>
                <p>Reference: {pendingCheckout.demo_reference}</p>
                <div className="demo-payment-amount">₹{Number(pendingCheckout.payable_amount).toFixed(2)}</div>
              </div>
            </div>

            <div className="demo-upi-panel">
              <div className="demo-upi-row">
                <span>UPI ID</span>
                <strong>{pendingCheckout.demo_upi_id}</strong>
              </div>
              <div className="demo-upi-row">
                <span>Plan</span>
                <strong>{pendingCheckout.plan_type.toUpperCase()}</strong>
              </div>
              <div className="demo-upi-row">
                <span>Start date</span>
                <strong>{formatDisplayDate(pendingCheckout.start_date)}</strong>
              </div>
            </div>

            <div className="demo-payment-note">
              This is a fake demo payment screen. No real money will be charged.
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setPaymentStep("form");
                  setPendingCheckout(null);
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => finalizeDemoPayment(pendingCheckout)}
                disabled={loading}
              >
                {loading ? "Confirming..." : "I Have Paid"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStep === "success") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content subscribe-modal subscribe-modal--success" onClick={(e) => e.stopPropagation()}>
          <div className="demo-success">
            <div className="demo-success__badge">PAID</div>
            <h2>Payment Successful</h2>
            <p>Your demo payment was accepted and the subscription is now active.</p>
            {paymentSummary && (
              <div className="demo-success__summary">
                <span>{provider.mess_name}</span>
                <strong>{paymentSummary.plan_type.toUpperCase()} subscription subscribed</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <div><strong>Rating:</strong> <StarRating value={provider.rating} size="sm" showValue /></div>
            <p><strong>Contact:</strong> {String(provider.contact || "-")}</p>
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
