import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../api/client";
import OrdersModal from "./OrdersModal";
import SubscribersModal from "./SubscribersModal";
import FeedbackModal from "./FeedbackModal";
import MenuUploadModal from "./MenuUploadModal";
import SubscriptionPricingModal from "./SubscriptionPricingModal";
import ProviderLocationModal from "./ProviderLocationModal";
import ProviderPhotosModal from "./ProviderPhotosModal";
import StarRating from "../common/StarRating";
import "./ProviderDashboard.css";

function formatOverviewDate(value) {
  if (!value) {
    return "No scheduled service date yet";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatInsightsDateRange(startValue, endValue) {
  if (!startValue || !endValue) {
    return "";
  }

  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  return `${start.toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${end.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`;
}

function formatInsightsAxisLabel(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatInsightsHeading(rangeKey) {
  if (rangeKey === "this_week") {
    return "This Week Insights";
  }
  if (rangeKey === "last_30_days") {
    return "Last 30 Days Insights";
  }
  return "This Month Insights";
}

function ProviderDashboard({ auth }) {
  const [profileData, setProfileData] = useState(null);
  const [insightsRange, setInsightsRange] = useState("this_month");
  const [insightsData, setInsightsData] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
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

  useEffect(() => {
    let cancelled = false;

    async function fetchProviderInsights() {
      if (!auth?.token) {
        return;
      }

      try {
        setInsightsLoading(true);
        setInsightsError(null);
        const response = await apiRequest(`/providers/insights?range=${insightsRange}`, {
          token: auth?.token,
        });

        if (!cancelled) {
          setInsightsData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setInsightsError(err.message || "Failed to load monthly insights");
        }
      } finally {
        if (!cancelled) {
          setInsightsLoading(false);
        }
      }
    }

    fetchProviderInsights();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, insightsRange]);

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

  const {
    active_customers,
    total_orders,
    menu_items_count,
    next_service_date,
    upcoming_breakfast_count,
    upcoming_lunch_count,
    upcoming_dinner_count,
    cancelled_breakfast_count,
    cancelled_lunch_count,
    cancelled_dinner_count,
    cancelled_meals_count,
    wallet_credit_issued,
  } = profileData;
  const dashboardDisplayName = auth?.user?.name || profileData.owner_name || profileData.mess_name;
  const nextDayMeals = upcoming_breakfast_count + upcoming_lunch_count + upcoming_dinner_count;
  const nextServiceDateLabel = formatOverviewDate(next_service_date);
  const mealSegments = [
    { label: "Breakfast", value: upcoming_breakfast_count, color: "var(--provider-chart-breakfast)" },
    { label: "Lunch", value: upcoming_lunch_count, color: "var(--provider-chart-lunch)" },
    { label: "Dinner", value: upcoming_dinner_count, color: "var(--provider-chart-dinner)" },
  ];
  const totalKitchenLoad = mealSegments.reduce((sum, segment) => sum + segment.value, 0);
  let currentAngle = 0;
  const mealChartBackground = totalKitchenLoad > 0
    ? `conic-gradient(${mealSegments
        .map((segment) => {
          const nextAngle = currentAngle + (segment.value / totalKitchenLoad) * 360;
          const stop = `${segment.color} ${currentAngle}deg ${nextAngle}deg`;
          currentAngle = nextAngle;
          return stop;
        })
        .join(", ")})`
    : "conic-gradient(color-mix(in srgb, var(--text-accent) 10%, transparent) 0deg 360deg)";
  const quickActions = [
    { key: "coverage", label: "Set Delivery Area", variant: "primary" },
    { key: "menu", label: "Upload Menu Items", variant: "primary" },
    { key: "photos", label: "Manage Photos", variant: "primary" },
    { key: "pricing", label: "Set Pricing", variant: "primary" },
    { key: "orders", label: "View Orders", variant: "secondary" },
    { key: "subscribers", label: "Manage Subscribers", variant: "secondary" },
    { key: "feedback", label: "View Feedback", variant: "secondary" },
  ];
  const insightsRangeOptions = [
    { key: "this_week", label: "This Week" },
    { key: "this_month", label: "This Month" },
    { key: "last_30_days", label: "Last 30 Days" },
  ];
  const insightsSummaryCards = insightsData
    ? [
        { label: "Orders", value: insightsData.orders_count, tone: "warm" },
        { label: "Active Subscribers", value: insightsData.active_subscribers_count, tone: "green" },
        { label: "New Customers", value: insightsData.new_customers_count, tone: "blue" },
        { label: "Not Renewed", value: insightsData.not_renewed_count, tone: "rose" },
      ]
    : [];
  const trendValues = insightsData?.daily_trend || [];
  const trendMax = Math.max(
    ...trendValues.flatMap((point) => [point.new_customers_count || 0, point.not_renewed_count || 0]),
    1,
  );
  const insightsDateLabel = formatInsightsDateRange(insightsData?.start_date, insightsData?.end_date);
  const insightsHeading = formatInsightsHeading(insightsRange);
  const netCustomerChange = (insightsData?.new_customers_count || 0) - (insightsData?.not_renewed_count || 0);
  const renewalRate = (insightsData?.ended_plans_count || 0) > 0
    ? Math.round(((insightsData?.renewed_count || 0) / insightsData.ended_plans_count) * 100)
    : null;
  const growthSignal = netCustomerChange > 0
    ? "Customer base is growing in this range"
    : netCustomerChange < 0
      ? "More customers left than joined in this range"
      : "Customer flow is balanced in this range";
  const ratingSignal = (insightsData?.feedback_count || 0) > 0
    ? `${Number(insightsData?.average_rating || 0).toFixed(1)} average from ${insightsData.feedback_count} feedback entries`
    : "No new feedback recorded in this range";

  return (
    <div className="provider-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{dashboardDisplayName}&apos;s Dashboard</h1>
          <p className="provider-name">
            {profileData.mess_name}
            {profileData.city ? ` · ${profileData.city}` : ""}
          </p>
        </div>

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
                <label>Service Address</label>
                <p>{profileData.service_address_text || "Not set yet"}</p>
              </div>
              <div className="info-item">
                <label>Delivery Radius</label>
                <p>{profileData.service_radius_km ? `${profileData.service_radius_km} km` : "Not set yet"}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{auth?.user?.email}</p>
              </div>
              <div className="info-item">
                <label>Rating</label>
                <div className="rating-badge">
                  <StarRating value={profileData.rating} size="md" showValue />
                </div>
              </div>
            </div>
          </div>
        </div>
                <div className="recent-activity">
          <h3>Service Overview</h3>
          <div className="activity-chart-card activity-chart-card--solo">
            <div className="activity-chart-card__header">
              <h4>Tomorrow&apos;s Kitchen Mix</h4>
              <p>{nextDayMeals} scheduled meals</p>
              <div className="activity-chart-card__date">
                For {nextServiceDateLabel}
              </div>
            </div>
            <div className="activity-chart">
              <div className="activity-chart__ring" style={{ background: mealChartBackground }}>
                <div className="activity-chart__center">
                  <strong>{nextDayMeals}</strong>
                  <span>Meals</span>
                </div>
              </div>
              <div className="activity-chart__details">
                <div className="activity-chart__legend">
                  {mealSegments.map((segment) => (
                    <div key={segment.label} className="activity-chart__legend-item">
                      <span
                        className="activity-chart__swatch"
                        style={{ background: segment.color }}
                      />
                      <div>
                        <strong>{segment.value}</strong>
                        <p>{segment.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="activity-highlights">
                  <div className="activity-highlight">
                    <span>Breakfast Cancelled</span>
                    <strong>{cancelled_breakfast_count || 0}</strong>
                  </div>
                  <div className="activity-highlight">
                    <span>Lunch Cancelled</span>
                    <strong>{cancelled_lunch_count || 0}</strong>
                  </div>
                  <div className="activity-highlight">
                    <span>Dinner Cancelled</span>
                    <strong>{cancelled_dinner_count || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{active_customers}</div>
            <div className="stat-label">Active Customers</div>
            <div className="stat-description">Taking your service</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{total_orders}</div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-description">Orders received</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{menu_items_count}</div>
            <div className="stat-label">Menu Items</div>
            <div className="stat-description">Currently listed</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{nextDayMeals}</div>
            <div className="stat-label">Next-Day Meals</div>
            <div className="stat-description">B {upcoming_breakfast_count} · L {upcoming_lunch_count} · D {upcoming_dinner_count}</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{cancelled_meals_count}</div>
            <div className="stat-label">Meal Cancellations</div>
            <div className="stat-description">Wallet credit ₹{Number(wallet_credit_issued || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.key}
                className={`action-btn ${action.variant}`}
                onClick={() => setActiveModal(action.key)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="provider-insights">
          <div className="provider-insights__header">
            <div>
              <h3>{insightsHeading}</h3>
              <p>{insightsDateLabel || "Track your recent provider performance"}</p>
            </div>
            <div className="provider-insights__filters">
              {insightsRangeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`provider-insights__filter ${insightsRange === option.key ? "active" : ""}`}
                  onClick={() => setInsightsRange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {insightsError && <div className="error-message">{insightsError}</div>}

          {insightsLoading && !insightsData ? (
            <div className="loading-message">Loading monthly insights...</div>
          ) : (
            <>
              <div className="provider-insights__summary">
                {insightsSummaryCards.map((card) => (
                  <article key={card.label} className={`provider-insights__card provider-insights__card--${card.tone}`}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                  </article>
                ))}
              </div>

              <div className="provider-insights__grid">
                <div className="provider-insights__panel">
                  <div className="provider-insights__panel-header">
                    <h4>Daily Trend</h4>
                    <p>Non-renewals vs new joins</p>
                  </div>
                  <div className="provider-insights__trend">
                    {trendValues.map((point) => (
                      <div key={point.date} className="provider-insights__trend-item">
                        <div className="provider-insights__trend-bars">
                          <div
                            className="provider-insights__trend-bar provider-insights__trend-bar--new-customers"
                            style={{ height: `${Math.max(((point.new_customers_count || 0) / trendMax) * 100, point.new_customers_count ? 10 : 0)}%` }}
                            title={`New joins: ${point.new_customers_count || 0}`}
                          />
                          <div
                            className="provider-insights__trend-bar provider-insights__trend-bar--not-renewed"
                            style={{ height: `${Math.max(((point.not_renewed_count || 0) / trendMax) * 100, point.not_renewed_count ? 10 : 0)}%` }}
                            title={`Not renewed: ${point.not_renewed_count || 0}`}
                          />
                        </div>
                        <span className="provider-insights__trend-label">{formatInsightsAxisLabel(point.date)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="provider-insights__legend">
                    <span><i className="provider-insights__legend-dot provider-insights__legend-dot--new-customers" /> New Joins</span>
                    <span><i className="provider-insights__legend-dot provider-insights__legend-dot--not-renewed" /> Not Renewed</span>
                  </div>
                </div>

                <div className="provider-insights__panel">
                  <div className="provider-insights__panel-header">
                    <h4>Range Analysis</h4>
                    <p>What this period says about customer retention</p>
                  </div>
                  <div className="provider-insights__analysis">
                    <div className="provider-insights__analysis-item">
                      <span>Net Customer Change</span>
                      <strong className={netCustomerChange >= 0 ? "positive" : "negative"}>
                        {netCustomerChange >= 0 ? `+${netCustomerChange}` : netCustomerChange}
                      </strong>
                      <p>{growthSignal}</p>
                    </div>
                    <div className="provider-insights__analysis-item">
                      <span>Renewal Health</span>
                      <strong>{renewalRate == null ? "-" : `${renewalRate}%`}</strong>
                      <p>
                        {renewalRate == null
                          ? "No plans ended in this range"
                          : `${insightsData?.renewed_count || 0} of ${insightsData?.ended_plans_count || 0} ended plans were followed by another plan`}
                      </p>
                    </div>
                  </div>
                  <div className="provider-insights__rating">
                    <span>Average Rating</span>
                    <strong>{Number(insightsData?.average_rating || 0).toFixed(1)}</strong>
                    <p>{ratingSignal}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>


      </div>

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
          window.dispatchEvent(new CustomEvent("pricingUpdated", { detail: newPricing }));
        }}
      />
      <ProviderLocationModal
        auth={auth}
        profileData={profileData}
        isOpen={activeModal === "coverage"}
        onClose={() => setActiveModal(null)}
        onUpdateSuccess={() => {
          setActiveModal(null);
          fetchProviderProfile({ background: true });
        }}
      />
      <ProviderPhotosModal
        auth={auth}
        isOpen={activeModal === "photos"}
        onClose={() => setActiveModal(null)}
        onUploadSuccess={() => fetchProviderProfile({ background: true })}
      />
    </div>
  );
}

export default ProviderDashboard;
