import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  cancelSubscriptionMeals,
  getMySubscriptionMeals,
  getMySubscriptions,
  getWallet,
  submitFeedback,
} from "../../api/client";
import "./CustomerDashboard.css";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function CustomerDashboard({ auth, refreshKey = 0 }) {
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [subscriptions, setSubscriptions] = useState([]);
  const [meals, setMeals] = useState([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [submittingFeedbackFor, setSubmittingFeedbackFor] = useState(null);
  const [cancellingMeals, setCancellingMeals] = useState([]);
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

      const [profileResponse, walletResponse, subsResponse, mealsResponse] = await Promise.all([
        apiRequest("/users/profile", { token: auth?.token }),
        getWallet(auth?.token),
        getMySubscriptions(auth?.token),
        getMySubscriptionMeals(auth?.token),
      ]);

      setProfile(profileResponse);
      setWallet(walletResponse || { balance: 0, transactions: [] });
      setSubscriptions(Array.isArray(subsResponse) ? subsResponse : []);
      setMeals(Array.isArray(mealsResponse) ? mealsResponse : []);
      setFeedbackDrafts((current) => {
        const next = { ...current };
        (Array.isArray(subsResponse) ? subsResponse : []).forEach((sub) => {
          next[sub.subscription_id] = next[sub.subscription_id] || {
            rating: String(sub.latest_feedback_rating || 5),
            comment: sub.latest_feedback_comment || "",
          };
        });
        return next;
      });
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

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active");
  const inactiveSubscriptions = subscriptions.filter((sub) => sub.status !== "active");

  const mealsBySubscription = useMemo(() => {
    return meals.reduce((acc, meal) => {
      if (!acc[meal.subscription_id]) {
        acc[meal.subscription_id] = [];
      }
      acc[meal.subscription_id].push(meal);
      return acc;
    }, {});
  }, [meals]);

  const handleMealCancel = async (subscriptionMealId) => {
    try {
      setCancellingMeals((current) => [...current, subscriptionMealId]);
      await cancelSubscriptionMeals(auth?.token, {
        subscription_meal_ids: [subscriptionMealId],
      });
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to cancel meal");
    } finally {
      setCancellingMeals((current) => current.filter((id) => id !== subscriptionMealId));
    }
  };

  const handleFeedbackSubmit = async (subscription) => {
    const draft = feedbackDrafts[subscription.subscription_id];
    if (!draft?.rating) {
      return;
    }

    try {
      setSubmittingFeedbackFor(subscription.subscription_id);
      await submitFeedback(auth?.token, {
        provider_id: subscription.provider_id,
        rating: Number(draft.rating),
        comment: draft.comment?.trim() || null,
      });
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedbackFor(null);
    }
  };

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

  return (
    <div className="customer-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <p className="customer-name">Welcome, {profile.name}!</p>
        </div>

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
          <div className="summary-card">
            <div className="summary-number">₹{Number(wallet.balance || 0).toFixed(2)}</div>
            <div className="summary-label">Wallet Balance</div>
            <div className="summary-desc">Auto-applied to your next order</div>
          </div>
        </div>

        <div className="subscriptions-section">
          <h2>Wallet Activity</h2>
          {wallet.transactions?.length ? (
            <div className="wallet-transactions">
              {wallet.transactions.slice(0, 8).map((transaction) => (
                <div key={transaction.wallet_transaction_id} className="wallet-transaction">
                  <div>
                    <strong>{transaction.note || transaction.source_type || transaction.transaction_type}</strong>
                    <p>{formatDate(transaction.created_at)}</p>
                  </div>
                  <span
                    className={
                      transaction.transaction_type === "credit"
                        ? "wallet-amount wallet-amount--credit"
                        : "wallet-amount wallet-amount--debit"
                    }
                  >
                    {transaction.transaction_type === "credit" ? "+" : "-"}₹{Number(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No wallet activity yet.</p>
              <p className="hint">Meal cancellation credits will appear here.</p>
            </div>
          )}
        </div>

        <div className="subscriptions-section">
          <h2>Your Active Subscriptions</h2>
          {activeSubscriptions.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any active subscriptions yet.</p>
              <p className="hint">Visit the Mess Providers section to find and subscribe to a meal plan.</p>
            </div>
          ) : (
            <div className="subscriptions-grid">
              {activeSubscriptions.map((sub) => {
                const draft = feedbackDrafts[sub.subscription_id] || { rating: "5", comment: "" };
                const upcomingMeals = (mealsBySubscription[sub.subscription_id] || [])
                  .filter((meal) => meal.status === "scheduled" || meal.status === "cancelled")
                  .slice(0, 9);

                return (
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
                        <span className="value">{formatDate(sub.start_date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">End Date:</span>
                        <span className="value">{formatDate(sub.end_date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Cancelled Meals:</span>
                        <span className="value">{sub.cancelled_meals_count || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Wallet Credit Earned:</span>
                        <span className="value">₹{Number(sub.wallet_credit_generated || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="meal-section">
                      <h4>Upcoming Meals</h4>
                      {upcomingMeals.length === 0 ? (
                        <p className="hint">No generated meals yet.</p>
                      ) : (
                        <div className="meal-list">
                          {upcomingMeals.map((meal) => (
                            <div key={meal.subscription_meal_id} className={`meal-chip is-${meal.status}`}>
                              <div>
                                <strong>{meal.meal_type}</strong>
                                <span>{formatDate(meal.service_date)}</span>
                              </div>
                              {meal.status === "scheduled" ? (
                                <button
                                  type="button"
                                  onClick={() => handleMealCancel(meal.subscription_meal_id)}
                                  disabled={cancellingMeals.includes(meal.subscription_meal_id)}
                                >
                                  {cancellingMeals.includes(meal.subscription_meal_id) ? "Cancelling..." : "Cancel"}
                                </button>
                              ) : (
                                <span className="meal-chip__state">{meal.status}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="feedback-editor">
                      <h4>Rate this provider</h4>
                      <div className="feedback-editor__row">
                        <select
                          value={draft.rating}
                          onChange={(event) =>
                            setFeedbackDrafts((current) => ({
                              ...current,
                              [sub.subscription_id]: {
                                ...draft,
                                rating: event.target.value,
                              },
                            }))
                          }
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} Star{value > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="action-btn reactivate"
                          onClick={() => handleFeedbackSubmit(sub)}
                          disabled={submittingFeedbackFor === sub.subscription_id}
                        >
                          {submittingFeedbackFor === sub.subscription_id ? "Saving..." : "Save Feedback"}
                        </button>
                      </div>
                      <textarea
                        value={draft.comment}
                        placeholder="Share how your current tiffin service is going..."
                        onChange={(event) =>
                          setFeedbackDrafts((current) => ({
                            ...current,
                            [sub.subscription_id]: {
                              ...draft,
                              comment: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {inactiveSubscriptions.length > 0 && (
          <div className="subscriptions-section">
            <h2>Paused & Past Subscriptions</h2>
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
                      <span className="value">{formatDate(sub.start_date)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">End Date:</span>
                      <span className="value">{formatDate(sub.end_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
