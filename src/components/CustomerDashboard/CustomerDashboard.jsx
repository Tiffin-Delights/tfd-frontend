import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  cancelSubscriptionMeals,
  createPayment,
  createSubscriptionCheckout,
  deleteSubscription,
  getMySubscriptionMeals,
  getMySubscriptions,
  getWallet,
  submitFeedback,
  verifyPayment,
} from "../../api/client";
import StarRating from "../common/StarRating";
import "./CustomerDashboard.css";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function formatMealLabel(value) {
  const labels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snacks: "Snacks",
  };

  return labels[String(value || "").toLowerCase()] || String(value || "Meal");
}

function getMealItems(meal) {
  const rawItems =
    meal?.dishes ||
    meal?.items ||
    meal?.menu_items ||
    meal?.delivered_items ||
    meal?.meal_items ||
    meal?.dish_names;

  if (Array.isArray(rawItems)) {
    return rawItems.filter(Boolean);
  }

  if (typeof rawItems === "string" && rawItems.trim()) {
    return rawItems
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (meal?.item_name) {
    return [meal.item_name];
  }

  return [];
}

function toDateValue(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatInputDate(value) {
  return value.toISOString().split("T")[0];
}

function asText(value, fallback = "-") {
  if (value == null || value === "") {
    return fallback;
  }

  return typeof value === "string" ? value : String(value);
}

function CustomerDashboard({ auth, refreshKey = 0 }) {
  const MEAL_SCHEDULE_PAGE_SIZE = 3;
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [subscriptions, setSubscriptions] = useState([]);
  const [meals, setMeals] = useState([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [submittingFeedbackFor, setSubmittingFeedbackFor] = useState(null);
  const [cancellingMeals, setCancellingMeals] = useState([]);
  const [deletingSubscriptionId, setDeletingSubscriptionId] = useState(null);
  const [renewingSubscriptionId, setRenewingSubscriptionId] = useState(null);
  const [mealSchedulePageBySubscription, setMealSchedulePageBySubscription] =
    useState({});
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

      const [profileResponse, walletResponse, subsResponse, mealsResponse] =
        await Promise.all([
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
            rating: String(sub.latest_feedback_rating ?? 5),
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

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active",
  );
  const inactiveSubscriptions = subscriptions.filter(
    (sub) => sub.status !== "active",
  );

  const mealsBySubscription = useMemo(() => {
    return meals.reduce((acc, meal) => {
      if (!acc[meal.subscription_id]) {
        acc[meal.subscription_id] = [];
      }
      acc[meal.subscription_id].push(meal);
      return acc;
    }, {});
  }, [meals]);

  const mealScheduleBySubscription = useMemo(() => {
    return activeSubscriptions
      .map((sub) => {
        const groupedByDate = (mealsBySubscription[sub.subscription_id] || [])
          .filter(
            (meal) =>
              meal.status === "scheduled" || meal.status === "cancelled",
          )
          .reduce((acc, meal) => {
            const dateKey = meal.service_date || "unknown-date";
            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(meal);
            return acc;
          }, {});

        const dates = Object.entries(groupedByDate)
          .sort(
            ([leftDate], [rightDate]) =>
              new Date(leftDate) - new Date(rightDate),
          )
          .map(([dateKey, dayMeals]) => ({
            dateKey,
            meals: ["breakfast", "lunch", "dinner"].map((mealType) => {
              const meal = dayMeals.find(
                (item) =>
                  String(item.meal_type || "").toLowerCase() === mealType,
              );
              return {
                mealType,
                meal,
                items: meal ? getMealItems(meal) : [],
              };
            }),
          }));

        return {
          subscription: sub,
          dates,
        };
      })
      .filter((entry) => entry.dates.length > 0);
  }, [activeSubscriptions, mealsBySubscription]);

  useEffect(() => {
    setMealSchedulePageBySubscription((current) => {
      const next = {};
      mealScheduleBySubscription.forEach(({ subscription, dates }) => {
        const pageCount = Math.max(
          1,
          Math.ceil(dates.length / MEAL_SCHEDULE_PAGE_SIZE),
        );
        next[subscription.subscription_id] = Math.min(
          current[subscription.subscription_id] || 0,
          pageCount - 1,
        );
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      if (
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key])
      ) {
        return current;
      }

      return next;
    });
  }, [mealScheduleBySubscription]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const hasSubscriptionEnded = useCallback(
    (subscription) => {
      const endDate = toDateValue(subscription?.end_date);
      return Boolean(endDate && endDate < today);
    },
    [today],
  );

  const getRenewStartDate = useCallback(
    (subscription) => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextDayAfterEnd =
        toDateValue(subscription?.end_date) || new Date(today);
      nextDayAfterEnd.setDate(nextDayAfterEnd.getDate() + 1);

      return formatInputDate(
        nextDayAfterEnd > tomorrow ? nextDayAfterEnd : tomorrow,
      );
    },
    [today],
  );

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
      setCancellingMeals((current) =>
        current.filter((id) => id !== subscriptionMealId),
      );
    }
  };

  const handleSubscriptionDelete = async (subscription) => {
    const confirmed = window.confirm(
      `Cancel the ${subscription.plan_type} subscription for ${subscription.customer_name}? This will delete the subscription and its related records.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSubscriptionId(subscription.subscription_id);
      setError(null);
      await deleteSubscription(auth?.token, subscription.subscription_id);
      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to cancel subscription");
    } finally {
      setDeletingSubscriptionId(null);
    }
  };

  const handleRenewSubscription = async (subscription) => {
    try {
      setRenewingSubscriptionId(subscription.subscription_id);
      setError(null);

      const checkout = await createSubscriptionCheckout(auth?.token, {
        provider_id: subscription.provider_id,
        plan_type: subscription.plan_type,
        start_date: getRenewStartDate(subscription),
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

      await fetchData();
    } catch (err) {
      setError(err.message || "Failed to renew subscription");
    } finally {
      setRenewingSubscriptionId(null);
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
          <h1>
          <span class="reveal-text">Welcome: {profile.name}. .</span>
          </h1>
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
 
            </div>
          </div>
        </div>

        <div className="subscriptions-summary">
          <div className="summary-card summary-card--combined">
            <div className="summary-label"><h2>Don't wanna eat?</h2></div>
            <div className="summary-copy">Cancel your meal and discount when you renew your service</div>
          </div>
          <div className="summary-card summary-card--wallet">
            <div className="summary-number">
              ₹{Number(wallet.balance || 0).toFixed(2)}
            </div>
            <div className="summary-label">Wallet Balance</div>
            <div className="summary-desc">Auto-applied to your next order</div>
          </div>
        </div>

        <div className="subscriptions-section">
          <h2>Upcoming Meal Schedule</h2>
          {mealScheduleBySubscription.length === 0 ? (
            <div className="empty-state">
              <p>No generated meals yet.</p>
              <p className="hint">
                Your next breakfast, lunch, and dinner will appear here once the
                schedule is generated.
              </p>
            </div>
          ) : (
            <div className="meal-schedule-grid">
              {mealScheduleBySubscription.map(({ subscription, dates }) =>
                (() => {
                  const currentPage =
                    mealSchedulePageBySubscription[
                      subscription.subscription_id
                    ] || 0;
                  const pageCount = Math.max(
                    1,
                    Math.ceil(dates.length / MEAL_SCHEDULE_PAGE_SIZE),
                  );
                  const visibleDates = dates.slice(
                    currentPage * MEAL_SCHEDULE_PAGE_SIZE,
                    currentPage * MEAL_SCHEDULE_PAGE_SIZE +
                      MEAL_SCHEDULE_PAGE_SIZE,
                  );
                  const hasPreviousDates = currentPage > 0;
                  const hasNextDates = currentPage < pageCount - 1;

                  return (
                    <div
                      key={subscription.subscription_id}
                      className="meal-schedule-card"
                    >
                      <div className="meal-schedule-card__header">
                        <div>
                          <p className="meal-schedule-card__eyebrow">
                            Current Plan
                          </p>
                          <h3>{asText(subscription.customer_name)}</h3>
                        </div>
                        <span className="meal-schedule-card__meta">
                          {asText(subscription.plan_type, "").toUpperCase()}
                        </span>
                      </div>
                      <div className="meal-timeline">
                        <button
                          type="button"
                          className={`meal-timeline__pager meal-timeline__pager--side${!hasPreviousDates ? " is-disabled" : ""}`}
                          onClick={() =>
                            setMealSchedulePageBySubscription((current) => ({
                              ...current,
                              [subscription.subscription_id]: Math.max(
                                0,
                                currentPage - 1,
                              ),
                            }))
                          }
                          disabled={!hasPreviousDates}
                        >
                          <span className="meal-timeline__pager-eyebrow">
                            Previous
                          </span>
                          <strong>Back 3</strong>
                          <span className="meal-timeline__pager-copy">
                            {hasPreviousDates
                              ? "Go to the previous set of dates."
                              : "You are already on the current set."}
                          </span>
                        </button>
                        {visibleDates.map((day) => (
                          <div
                            key={`${subscription.subscription_id}-${day.dateKey}`}
                            className="meal-day-card"
                          >
                            <div className="meal-day-card__header">
                              <div>
                                <p className="meal-day-card__eyebrow">
                                  Delivery Date
                                </p>
                                <h4>{formatDate(day.dateKey)}</h4>
                              </div>
                            </div>
                            <div className="meal-day-card__slots">
                              {day.meals.map(({ mealType, meal, items }) => (
                                <div
                                  key={`${day.dateKey}-${mealType}`}
                                  className={`meal-slot${meal ? ` is-${meal.status}` : " is-empty"}`}
                                >
                                  <div className="meal-slot__top">
                                    <div>
                                      <strong>
                                        {formatMealLabel(mealType)}
                                      </strong>
                                      <p>
                                        {items.length > 0
                                          ? items.join(", ")
                                          : meal
                                            ? "Menu details will be shared soon."
                                            : "Not scheduled for this day."}
                                      </p>
                                    </div>
                                    {meal ? (
                                      meal.status === "scheduled" ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMealCancel(
                                              meal.subscription_meal_id,
                                            )
                                          }
                                          disabled={cancellingMeals.includes(
                                            meal.subscription_meal_id,
                                          )}
                                        >
                                          {cancellingMeals.includes(
                                            meal.subscription_meal_id,
                                          )
                                            ? "Cancelling..."
                                            : "Cancel"}
                                        </button>
                                      ) : (
                                        <span className="meal-slot__state">
                                          {meal.status}
                                        </span>
                                      )
                                    ) : (
                                      <span className="meal-slot__state meal-slot__state--muted">
                                        Not available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className={`meal-timeline__pager meal-timeline__pager--side${!hasNextDates ? " is-disabled" : ""}`}
                          onClick={() =>
                            setMealSchedulePageBySubscription((current) => ({
                              ...current,
                              [subscription.subscription_id]: Math.min(
                                pageCount - 1,
                                currentPage + 1,
                              ),
                            }))
                          }
                          disabled={!hasNextDates}
                        >
                          <span className="meal-timeline__pager-eyebrow">
                            Next
                          </span>
                          <strong>Next 3</strong>
                          <span className="meal-timeline__pager-copy">
                            {hasNextDates
                              ? "See the next continuous set of dates."
                              : "No later dates are available yet."}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })(),
              )}
            </div>
          )}
        </div>

        <div className="subscriptions-section">
          <h2>Your Active Subscriptions</h2>
          {activeSubscriptions.length === 0 ? (
            <div className="empty-state">
              <p>You don't have any active subscriptions yet.</p>
              <p className="hint">
                Visit the Mess Providers section to find and subscribe to a meal
                plan.
              </p>
            </div>
          ) : (
            <div className="subscriptions-grid">
              {activeSubscriptions.map((sub) => {
                const draft = feedbackDrafts[sub.subscription_id] || {
                  rating: "5",
                  comment: "",
                };
                const renewEnabled = hasSubscriptionEnded(sub);

                return (
                  <div
                    key={sub.subscription_id}
                    className="subscription-card active"
                  >
                    <div className="card-header">
                      <h3>{asText(sub.customer_name)}</h3>
                      <span className="status-badge active">ACTIVE</span>
                    </div>
                    <div className="card-details">
                      <div className="detail-row">
                        <span className="label">Plan Type:</span>
                        <span className="value">
                          {asText(sub.plan_type, "").toUpperCase()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Start Date:</span>
                        <span className="value">
                          {formatDate(sub.start_date)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">End Date:</span>
                        <span className="value">
                          {formatDate(sub.end_date)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Cancelled Meals:</span>
                        <span className="value">
                          {sub.cancelled_meals_count || 0}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Wallet Credit Earned:</span>
                        <span className="value">
                          ₹{Number(sub.wallet_credit_generated || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="feedback-editor">
                      <h4>Rate this provider</h4>
                      <div className="feedback-editor__row">
                        <StarRating
                          value={draft.rating}
                          editable
                          size="lg"
                          showValue
                          onChange={(value) =>
                            setFeedbackDrafts((current) => ({
                              ...current,
                              [sub.subscription_id]: {
                                ...draft,
                                rating: String(value),
                              },
                            }))
                          }
                        />
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
                      <button
                        type="button"
                        className="action-btn reactivate feedback-save-btn"
                        onClick={() => handleFeedbackSubmit(sub)}
                        disabled={submittingFeedbackFor === sub.subscription_id}
                      >
                        {submittingFeedbackFor === sub.subscription_id
                          ? "Saving..."
                          : "Save Feedback"}
                      </button>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="action-btn cancel"
                          onClick={() => handleSubscriptionDelete(sub)}
                          disabled={
                            deletingSubscriptionId === sub.subscription_id
                          }
                        >
                          {deletingSubscriptionId === sub.subscription_id
                            ? "Cancelling..."
                            : "Cancel Subscription"}
                        </button>
                        <button
                          type="button"
                          className="action-btn reactivate"
                          onClick={() => handleRenewSubscription(sub)}
                          disabled={
                            !renewEnabled ||
                            renewingSubscriptionId === sub.subscription_id
                          }
                          title={
                            renewEnabled
                              ? "Renew this subscription"
                              : "Renew becomes available after the end date"
                          }
                        >
                          {renewingSubscriptionId === sub.subscription_id
                            ? "Renewing..."
                            : "Renew"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="subscriptions-section">
          <h2>Wallet Activity</h2>
          {wallet.transactions?.length ? (
            <div className="wallet-transactions wallet-transactions--scrollable">
              {wallet.transactions.slice(0, 3).map((transaction) => (
                <div
                  key={transaction.wallet_transaction_id}
                  className="wallet-transaction"
                >
                  <div>
                    <strong>
                      {asText(
                        transaction.note ||
                          transaction.source_type ||
                          transaction.transaction_type,
                      )}
                    </strong>
                    <p>{formatDate(transaction.created_at)}</p>
                  </div>
                  <span
                    className={
                      asText(transaction.transaction_type) === "credit"
                        ? "wallet-amount wallet-amount--credit"
                        : "wallet-amount wallet-amount--debit"
                    }
                  >
                    {asText(transaction.transaction_type) === "credit"
                      ? "+"
                      : "-"}
                    ₹{Number(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No wallet activity yet.</p>
              <p className="hint">
                Meal cancellation credits will appear here.
              </p>
            </div>
          )}
        </div>

        {inactiveSubscriptions.length > 0 && (
          <div className="subscriptions-section">
            <h2>Paused & Past Subscriptions</h2>
            <div className="subscriptions-grid">
              {inactiveSubscriptions.map((sub) => {
                const renewEnabled = hasSubscriptionEnded(sub);

                return (
                  <div
                    key={sub.subscription_id}
                    className="subscription-card inactive"
                  >
                    <div className="card-header">
                      <h3>{asText(sub.customer_name)}</h3>
                      <span
                        className={`status-badge ${asText(sub.status, "").toLowerCase()}`}
                      >
                        {asText(sub.status, "").toUpperCase()}
                      </span>
                    </div>
                    <div className="card-details">
                      <div className="detail-row">
                        <span className="label">Plan Type:</span>
                        <span className="value">
                          {asText(sub.plan_type, "").toUpperCase()}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Start Date:</span>
                        <span className="value">
                          {formatDate(sub.start_date)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="label">End Date:</span>
                        <span className="value">
                          {formatDate(sub.end_date)}
                        </span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="action-btn reactivate"
                        onClick={() => handleRenewSubscription(sub)}
                        disabled={
                          !renewEnabled ||
                          renewingSubscriptionId === sub.subscription_id
                        }
                        title={
                          renewEnabled
                            ? "Renew this subscription"
                            : "Renew becomes available after the end date"
                        }
                      >
                        {renewingSubscriptionId === sub.subscription_id
                          ? "Renewing..."
                          : "Renew"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
