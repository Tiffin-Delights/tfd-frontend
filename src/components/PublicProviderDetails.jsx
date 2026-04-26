import { useEffect, useMemo, useState } from "react";
import StarRating from "./common/StarRating";
import "./MessProviders.css";
import {
  getPublicProvider,
  getPublicProviderFeedback,
  getPublicProviderMenu,
} from "../api/client";

function getReviewerInitials(name, userId) {
  const label = String(name || "").trim();
  if (!label) {
    return `C${userId ?? ""}`.slice(0, 2).toUpperCase();
  }

  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "CU";
}

function MenuList({ title, items }) {
  return (
    <div className="menu-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PublicProviderDetails({ providerId, onBack }) {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [providerFeedback, setProviderFeedback] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProvider() {
      try {
        setLoading(true);
        setError("");
        const response = await getPublicProvider(providerId);
        if (!cancelled) {
          setProvider(response);
        }
      } catch (err) {
        if (!cancelled) {
          setProvider(null);
          setError(err.message || "Unable to load provider");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProvider();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  useEffect(() => {
    if (!providerId) {
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      setMenuLoading(true);
      setFeedbackLoading(true);
      setMenuError("");
      setFeedbackError("");

      const [menuResult, feedbackResult] = await Promise.allSettled([
        getPublicProviderMenu(providerId),
        getPublicProviderFeedback(providerId),
      ]);

      if (cancelled) {
        return;
      }

      if (menuResult.status === "fulfilled") {
        setMenuItems(Array.isArray(menuResult.value) ? menuResult.value : []);
      } else {
        setMenuItems([]);
        setMenuError(menuResult.reason?.message || "Unable to load menu");
      }

      if (feedbackResult.status === "fulfilled") {
        setProviderFeedback(Array.isArray(feedbackResult.value) ? feedbackResult.value : []);
      } else {
        setProviderFeedback([]);
        setFeedbackError(feedbackResult.reason?.message || "Unable to load customer feedback");
      }

      setMenuLoading(false);
      setFeedbackLoading(false);
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [providerId]);

  const groupedMenu = useMemo(() => {
    const grouped = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    };

    menuItems.forEach((item) => {
      const day = String(item.day || "").slice(0, 3).toUpperCase();
      const dishes = Array.isArray(item.dishes) ? item.dishes.join(", ") : "Menu not available";
      const line = `${day}: ${dishes}`;
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(line);
      }
    });

    return grouped;
  }, [menuItems]);

  if (loading) {
    return (
      <section className="mess-providers public-provider-page">
        <div className="providers-state">Loading provider details...</div>
      </section>
    );
  }

  if (error || !provider) {
    return (
      <section className="mess-providers public-provider-page">
        <div className="menu-details">
          <button className="btn ghost back-btn" onClick={onBack}>
            Back to home
          </button>
          <p className="providers-state providers-state--error">
            {error || "Provider not found"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mess-providers public-provider-page">
      <div className="menu-details">
        <button className="btn ghost back-btn" onClick={onBack}>
          Back to home
        </button>

        <h3>{provider.mess_name} - Full Menu</h3>

        <div className="provider-details__intro">
          <div>
            <p><strong>Rating:</strong> <StarRating value={provider.rating} size="sm" showValue /></p>
            <p><strong>Contact:</strong> {provider.contact}</p>
            <p><strong>Address:</strong> {provider.service_address_text || provider.city || "Address not added"}</p>
          </div>
          <div>
            {provider.weekly_price > 0 && <p><strong>Weekly:</strong> Rs {provider.weekly_price}/week</p>}
            {provider.monthly_price > 0 && <p><strong>Monthly:</strong> Rs {provider.monthly_price}/month</p>}
          </div>
        </div>

        {menuLoading && <p className="providers-state">Loading menu...</p>}
        {!menuLoading && menuError && <p className="providers-state providers-state--error">{menuError}</p>}

        {!menuLoading && !menuError && (
          <div className="menu-grid">
            <MenuList title="Breakfast" items={groupedMenu.breakfast.length ? groupedMenu.breakfast : ["No breakfast menu available"]} />
            <MenuList title="Lunch" items={groupedMenu.lunch.length ? groupedMenu.lunch : ["No lunch menu available"]} />
            <MenuList title="Snacks" items={groupedMenu.snacks.length ? groupedMenu.snacks : ["No snacks menu available"]} />
            <MenuList title="Dinner" items={groupedMenu.dinner.length ? groupedMenu.dinner : ["No dinner menu available"]} />
          </div>
        )}

        <div className="provider-reviews">
          <div className="provider-reviews__header">
            <div>
              <p className="provider-reviews__eyebrow">Customer Feedback</p>
              <h4>What customers are saying</h4>
            </div>
            <div className="provider-reviews__summary">
              <div className="provider-reviews__metric">
                <strong>{Number(provider.rating || 0).toFixed(1)}</strong>
                <span>Average rating</span>
              </div>
              <div className="provider-reviews__metric">
                <strong>{providerFeedback.length}</strong>
                <span>Review{providerFeedback.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>

          {feedbackLoading && <p className="providers-state">Loading customer feedback...</p>}
          {!feedbackLoading && feedbackError && (
            <p className="providers-state providers-state--error">{feedbackError}</p>
          )}

          {!feedbackLoading && !feedbackError && providerFeedback.length === 0 && (
            <div className="provider-reviews__empty">
              No written feedback yet for this mess.
            </div>
          )}

          {!feedbackLoading && !feedbackError && providerFeedback.length > 0 && (
            <div className="provider-reviews__list">
              {providerFeedback.map((feedback) => (
                <article key={feedback.feedback_id} className="provider-review-card">
                  <div className="provider-review-card__header">
                    <div className="provider-review-card__identity">
                      <span className="provider-review-card__avatar">
                        {getReviewerInitials(feedback.customer_name, feedback.user_id)}
                      </span>
                      <div>
                        <h5>{feedback.customer_name || `Customer #${feedback.user_id}`}</h5>
                        <p>Reviewed on {new Date(feedback.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="provider-review-card__rating">
                      <StarRating value={feedback.rating} size="sm" showValue />
                    </div>
                  </div>
                  <p className="provider-review-card__comment">
                    {feedback.comment?.trim()
                      ? `“${feedback.comment.trim()}”`
                      : "No written comment provided."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PublicProviderDetails;
