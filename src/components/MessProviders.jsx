import { useCallback, useEffect, useMemo, useState } from "react";
import "./MessProviders.css";
import {
  createOrder,
  createSubscription,
  getProviderMenu,
  listProviders,
  submitFeedback,
  getMySubscriptions,
  getProviderPricing,
} from "../api/client";

function MenuList({ title, items, price }) {
  return (
    <div className="menu-block">
      <h4>{title}</h4>
      {price ? <p className="menu-price">₹ {price}</p> : null}
      <ul>
        {items.length === 0 && <li>Menu not available</li>}
        {items.map((item, index) => (
          <li key={`${title}-${index}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const PLAN_DURATIONS = {
  weekly: 7,
  monthly: 30,
};

function SubscriptionModal({ visible, onClose, provider, auth, onSubscriptionSuccess }) {
  const [planType, setPlanType] = useState("weekly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [providerPricing, setProviderPricing] = useState(null);

  useEffect(() => {
    if (visible && provider) {
      setPlanType("weekly");
      setStartDate(new Date().toISOString().split("T")[0]);
      setLoading(false);
      setError("");
      setSuccess(false);
      setAlreadySubscribed(false);
      loadProviderPricing();
    }
  }, [visible, provider]);

  // Listen for pricing updates
  useEffect(() => {
    const handlePricingUpdate = (event) => {
      if (visible) {
        setProviderPricing(event.detail);
      }
    };
    
    window.addEventListener('pricingUpdated', handlePricingUpdate);
    return () => window.removeEventListener('pricingUpdated', handlePricingUpdate);
  }, [visible]);

  // Auto-close after success popup is shown
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Show success popup for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  // Auto-close after already subscribed popup is shown
  useEffect(() => {
    if (alreadySubscribed) {
      const timer = setTimeout(() => {
        onClose();
        // Reset alreadySubscribed state when closing
        setTimeout(() => setAlreadySubscribed(false), 100);
      }, 2500); // Show already subscribed popup for 2.5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [alreadySubscribed, onClose]);

  const computedEndDate = () => {
    const days = PLAN_DURATIONS[planType];
    const date = new Date(startDate);
    date.setDate(date.getDate() + (days - 1));
    return date.toISOString().split("T")[0];
  };

  const loadProviderPricing = async () => {
    try {
      const pricing = await getProviderPricing(provider.provider_id, auth?.token);
      setProviderPricing(pricing);
    } catch (err) {
      console.error("Failed to load provider pricing:", err);
      // Use default prices as fallback
      setProviderPricing({ weekly_price: 899, monthly_price: 3299 });
    }
  };

  if (!provider) return null;
  if (!visible && !success && !alreadySubscribed) return null;

  // If already subscribed, show alert popup
  if (alreadySubscribed) {
    return (
      <div className="subscription-modal-overlay" onClick={onClose}>
        <div className="subscription-already-popup">
          <div className="already-icon">ℹ️</div>
          <h2>Already Subscribed</h2>
          <p className="already-provider-name">{provider.mess_name}</p>
          <div className="already-message">
            <p>You already have an active subscription for this plan with {provider.mess_name}.</p>
            <p>You cannot subscribe again until your current subscription expires.</p>
          </div>
          <button className="btn secondary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    );
  }

  // If success, show success popup instead of form
  if (success) {
    return (
      <div className="subscription-modal-overlay" onClick={onClose}>
        <div className="subscription-success-popup">
          <div className="success-icon">✓</div>
          <h2>Subscription Confirmed!</h2>
          <p className="success-provider-name">{provider.mess_name}</p>
          <div className="success-details">
            <div className="detail-item">
              <span className="label">Plan Type:</span>
              <span className="value">{planType.charAt(0).toUpperCase() + planType.slice(1)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Start Date:</span>
              <span className="value">{new Date(startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">End Date:</span>
              <span className="value">{new Date(computedEndDate()).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Amount Paid:</span>
              <span className="value price">₹ {planType === "weekly" ? providerPricing?.weekly_price || 899 : providerPricing?.monthly_price || 3299}</span>
            </div>
          </div>
          <p className="success-message">Your subscription is now active. You will receive meals starting from tomorrow.</p>
          <button className="btn primary" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auth?.token) {
      setError("Please log in as a customer to subscribe.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    setAlreadySubscribed(false);

    try {
      const endDate = computedEndDate();
      const totalAmount = planType === "weekly" 
        ? providerPricing?.weekly_price || 899
        : providerPricing?.monthly_price || 3299;

      const subscriptionPayload = {
        provider_id: provider.provider_id,
        plan_type: planType,
        start_date: startDate,
        end_date: endDate,
        status: "active",
      };

      await createSubscription(auth?.token, subscriptionPayload);

      try {
        await createOrder(auth?.token, {
          provider_id: provider.provider_id,
          order_type: "subscription",
          start_date: startDate,
          end_date: endDate,
          total_amount: totalAmount,
        });
      } catch (orderErr) {
        try {
          await createSubscription(auth?.token, {
            ...subscriptionPayload,
            status: "cancelled",
          });
        } catch (cleanupErr) {
          console.error("Failed to rollback subscription after order error", cleanupErr);
        }
        throw orderErr;
      }

      setSuccess(true);
      onSubscriptionSuccess?.();
    } catch (err) {
      const message = err?.message || "Unable to create subscription";
      if (message.toLowerCase().includes("already have an active")) {
        setAlreadySubscribed(true);
        setError("");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!auth?.token) {
      setFeedbackError("Login required to submit feedback.");
      return;
    }
    if (!rating) {
      setFeedbackError("Please select a rating between 1 and 5.");
      return;
    }

    try {
      setFeedbackLoading(true);
      setFeedbackError("");
      await submitFeedback(auth.token, {
        provider_id: provider.provider_id,
        rating,
        comment: comment.trim() || null,
      });
      setFeedbackSuccess(true);
      onFeedbackSubmitted?.();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setFeedbackError(err?.message || "Unable to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Success Popup - Show this instead of form when subscription succeeds
  if (success) {
    return (
      <div className="subscription-modal-overlay" onClick={onClose}>
        <div className="subscription-success-popup">
          <div className="success-icon">✓</div>
          <h2>Subscription Confirmed!</h2>
          <p className="success-provider-name">{provider.mess_name}</p>
          <div className="success-details">
            <div className="detail-item">
              <span className="label">Plan Type:</span>
              <span className="value">{planType.charAt(0).toUpperCase() + planType.slice(1)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Start Date:</span>
              <span className="value">{new Date(startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">End Date:</span>
              <span className="value">{new Date(computedEndDate()).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Amount Paid:</span>
              <span className="value price">₹ {planType === "weekly" ? providerPricing?.weekly_price || 899 : providerPricing?.monthly_price || 3299}</span>
            </div>
          </div>
          <p className="success-message">Your subscription is now active. You will receive meals starting from tomorrow.</p>
          <button className="btn primary" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subscription-modal__header">
          <div>
            <p className="eyebrow">Subscribe to</p>
            <h3>{provider.mess_name}</h3>
          </div>
          <button className="close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="subscription-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Choose Plan</span>
            <div className="plan-toggle">
              <button
                type="button"
                className={planType === "weekly" ? "plan-option active" : "plan-option"}
                onClick={() => setPlanType("weekly")}
              >
                <strong>Weekly</strong>
                <small>₹ {providerPricing?.weekly_price || 899}</small>
              </button>
              <button
                type="button"
                className={planType === "monthly" ? "plan-option active" : "plan-option"}
                onClick={() => setPlanType("monthly")}
              >
                <strong>Monthly</strong>
                <small>₹ {providerPricing?.monthly_price || 3299}</small>
              </button>
            </div>
          </label>

          <label className="field">
            <span>Start Date</span>
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <div className="field readonly">
            <span>End Date (auto)</span>
            <div className="readonly-box">{computedEndDate()}</div>
          </div>

          <div className="field readonly">
            <span>Total Amount</span>
            <div className="readonly-box">₹ {planType === "weekly" ? providerPricing?.weekly_price || 899 : providerPricing?.monthly_price || 3299}</div>
          </div>

          {error && <p className="error-text">{error}</p>}
          {alreadySubscribed && (
            <p className="info-text">You're already subscribed to this plan for this mess.</p>
          )}

          <button className="btn primary submit" type="submit" disabled={loading || success}>
            {loading ? "Processing..." : success ? "Subscription Confirmed" : "Confirm Subscription"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FeedbackFormModal({ visible, onClose, provider, auth, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment("");
      setLoading(false);
      setError("");
      setSuccess(false);
    }
  }, [visible]);

  if (!visible || !provider) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!auth?.token) {
      setError("Please log in as a customer to share feedback.");
      return;
    }
    if (!rating) {
      setError("Select a rating between 1 and 5.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await submitFeedback(auth.token, {
        provider_id: provider.provider_id,
        rating,
        comment: comment.trim() || null,
      });
      setSuccess(true);
      onFeedbackSubmitted?.();
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err?.message || "Unable to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal feedback-form" onClick={(e) => e.stopPropagation()}>
        <div className="subscription-modal__header">
          <div>
            <p className="eyebrow">Share Your Experience</p>
            <h3>{provider.mess_name}</h3>
          </div>
          <button className="close-btn" type="button" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="feedback-step" onSubmit={handleSubmit}>
          <div className="rating-options">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={value <= rating ? "rating-star active" : "rating-star"}
                onClick={() => setRating(value)}
              >
                {value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">Thanks for rating this mess!</p>}
          <button className="btn primary submit" type="submit" disabled={loading || success}>
            {loading ? "Sending..." : success ? "Submitted" : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MessProviders({ auth }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState("");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [mySubscriptions, setMySubscriptions] = useState([]);

  const loadMyPlans = useCallback(async () => {
    if (!auth?.token) return;
    try {
      setLoadingPlans(true);
      const data = await getMySubscriptions(auth.token);
      setMySubscriptions(data || []);
    } catch (planErr) {
      console.error("Failed to load subscriptions", planErr);
    } finally {
      setLoadingPlans(false);
    }
  }, [auth?.token]);

  const loadProviders = useCallback(async () => {
    if (!auth?.token) return [];
    setLoadingProviders(true);
    setError("");
    try {
      const data = await listProviders(auth.token);
      setProviders(data || []);
      return data || [];
    } catch (err) {
      setError(err.message || "Unable to load providers.");
      return [];
    } finally {
      setLoadingProviders(false);
    }
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    loadProviders();
    loadMyPlans();
  }, [auth?.token, loadProviders, loadMyPlans]);

  useEffect(() => {
    if (!selectedProvider || !auth?.token) {
      return;
    }

    const loadMenu = async () => {
      setLoadingMenu(true);
      setError("");
      try {
        const data = await getProviderMenu(auth.token, selectedProvider.provider_id);
        setMenuItems(data || []);
      } catch (err) {
        setError(err.message || "Unable to load menu.");
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, [selectedProvider, auth?.token]);

  useEffect(() => {
    setShowSubscriptionModal(false);
    setShowFeedbackModal(false);
  }, [selectedProvider]);

  const handleFeedbackSubmitted = useCallback(async () => {
    const updatedList = await loadProviders();
    if (!updatedList.length) {
      return;
    }
    setSelectedProvider((prev) => {
      if (!prev) return prev;
      const refreshed = updatedList.find(
        (provider) => provider.provider_id === prev.provider_id
      );
      return refreshed || prev;
    });
    await loadMyPlans();
  }, [loadProviders, loadMyPlans]);

  const groupedMenu = useMemo(() => {
    const byDay = {
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
      Saturday: {},
      Sunday: {},
    };

    // Map day from API to display name
    const dayMap = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    // Map meal type to display name
    const mealMap = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      snacks: "Snacks",
      dinner: "Dinner",
    };

    // Group items by day, then by meal type
    for (const item of menuItems) {
      const dayName = dayMap[item.day] || item.day;
      const mealName = mealMap[item.meal_type] || item.meal_type;

      if (!byDay[dayName][mealName]) {
        byDay[dayName][mealName] = [];
      }
      byDay[dayName][mealName].push(item);
    }

    return byDay;
  }, [menuItems]);

  return (
    <section className="mess-providers" id="mess-providers">
      {auth?.token && (
        <div className="plan-banner">
          <div className="plan-banner__header">
            <div>
              <p className="eyebrow">Your Active Plans</p>
              <h3>Keep Track Of Your Meals</h3>
            </div>
            <button className="btn ghost" type="button" onClick={loadMyPlans} disabled={loadingPlans}>
              {loadingPlans ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {mySubscriptions.length === 0 ? (
            <p className="plan-banner__empty">No active plans yet. Pick a mess below to start.</p>
          ) : (
            <div className="plan-banner__list">
              {mySubscriptions.map((plan) => (
                <div key={plan.subscription_id} className="plan-banner__card">
                  <div className="plan-banner__title">{plan.customer_name}</div>
                  <div className="plan-banner__meta">{plan.plan_type} · {plan.status}</div>
                  <div className="plan-banner__dates">
                    {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="section-head">
        <p className="eyebrow">Mess Providers</p>
        <h2>Choose Your Mess</h2>
        <p className="lede">
          Click on Details to see the full menu of any mess provider.
        </p>
      </div>

      {!selectedProvider && (
        <div className="provider-grid">
          {loadingProviders && <p className="info-text">Loading providers...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loadingProviders && !error && providers.length === 0 && (
            <p className="info-text">No providers found. Please add provider data from backend.</p>
          )}

          {providers.map((provider) => (
            <article className="provider-card" key={provider.provider_id}>
              <h3>{provider.mess_name}</h3>
              <p>
                <strong>Location:</strong> {provider.city}
              </p>
              <p className="rating-line">
                <strong>Rating:</strong> ⭐ {Number(provider.rating || 0).toFixed(1)}
              </p>
              <p>
                <strong>Plan:</strong> Tap Details to view meal pricing
              </p>
              <button
                className="btn primary"
                onClick={() => setSelectedProvider(provider)}
              >
                Details
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedProvider && (
        <div className="menu-details">
          <button
            className="btn ghost back-btn"
            onClick={() => {
              setSelectedProvider(null);
              setMenuItems([]);
            }}
          >
            Back to all providers
          </button>

          <div className="menu-header">
            <h3>{selectedProvider.mess_name} - Full Menu</h3>
            <div className="menu-rating">⭐ {Number(selectedProvider.rating || 0).toFixed(1)}</div>
          </div>

          <div className="menu-grid">
            {loadingMenu && <p className="info-text">Loading menu...</p>}
            {!loadingMenu && error && <p className="error-text">{error}</p>}

            {!loadingMenu && !error && menuItems.length === 0 && (
              <p className="info-text">No menu items available for this provider yet.</p>
            )}

            {!loadingMenu && !error && menuItems.length > 0 && (
              <>
                <div className="week-menu">
                  {Object.entries(groupedMenu).map(([dayName, meals]) => {
                    const hasMeals = Object.keys(meals).length > 0;
                    return (
                      <div key={dayName} className="day-menu">
                        <h3 className="day-title">{dayName}</h3>
                        {!hasMeals ? (
                          <p className="no-menu-text">Menu not available</p>
                        ) : (
                          <div className="meals-for-day">
                            {Object.entries(meals).map(([mealName, mealItems]) => (
                              <div key={`${dayName}-${mealName}`} className="meal-item">
                                <div className="meal-header">
                                  <span className="meal-name">{mealName}</span>
                                </div>
                                <ul className="dishes-list">
                                  {mealItems[0]?.dishes && Array.isArray(mealItems[0].dishes) ? (
                                    mealItems[0].dishes.map((dish, idx) => (
                                      <li key={idx}>• {dish}</li>
                                    ))
                                  ) : (
                                    <li>No dishes available</li>
                                  )}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="subscription-cta">
                  <h4>Ready to start?</h4>
                  <p>Select a subscription plan for {selectedProvider.mess_name}.</p>
                  <button
                    className="btn primary"
                    type="button"
                    onClick={() => setShowSubscriptionModal(true)}
                    disabled={!auth?.token}
                  >
                    Choose Plan
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => setShowFeedbackModal(true)}
                    disabled={!auth?.token}
                  >
                    Share Feedback
                  </button>
                  {!auth?.token && <small>Please log in as customer to subscribe.</small>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        provider={selectedProvider}
        auth={auth}
        onSubscriptionSuccess={handleFeedbackSubmitted}
      />
      <FeedbackFormModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        provider={selectedProvider}
        auth={auth}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </section>
  );
}

export default MessProviders;
