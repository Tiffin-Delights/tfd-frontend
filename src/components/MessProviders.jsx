import { useCallback, useEffect, useMemo, useState } from "react";
import "./MessProviders.css";
import { getProviderFeedback, getProviderMenu, listProviders, updateUserLocation } from "../api/client";
import SubscribeModal from "./MessProviders/SubscribeModal";
import LocationPicker from "./Location/LocationPicker";
import StarRating from "./common/StarRating";

function MenuList({ title, items }) {
  return (
    <div className="menu-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const EMPTY_PHOTOS = [];

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

function ProviderGallery({ provider }) {
  const photos = Array.isArray(provider?.photo_urls) ? provider.photo_urls : EMPTY_PHOTOS;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % photos.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, [photos.length, provider?.provider_id]);

  if (photos.length === 0) {
    return (
      <div className="provider-gallery provider-gallery--empty">
        <span>No photos yet</span>
      </div>
    );
  }

  return (
    <div className="provider-gallery">
      <img src={photos[activeIndex]} alt={`${provider.mess_name} preview`} />
      {photos.length > 1 && (
        <div className="provider-gallery__dots">
          {photos.map((photoUrl, index) => (
            <button
              key={photoUrl}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getProviderSearchText(provider) {
  return [
    provider?.mess_name,
    provider?.contact,
    provider?.location,
    provider?.address,
    provider?.description,
    provider?.provider_food_category === "pure_veg" ? "pure veg" : "mixed non veg",
    provider?.weekly_price > 0 ? "weekly budget affordable" : "",
    provider?.monthly_price > 0 ? "monthly plan" : "",
    provider?.rating >= 4 ? "top rated best" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function MessProviders({ auth, onSubscriptionCreated, onAuthUserUpdate, dietTheme = "nonveg" }) {
  const INITIAL_VISIBLE_PROVIDERS = 7;
  const PROVIDERS_LOAD_STEP = 8;
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [providerFeedback, setProviderFeedback] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [menuError, setMenuError] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [subscribeModal, setSubscribeModal] = useState(false);
  const [selectedForSubscribe, setSelectedForSubscribe] = useState(null);
  const [locationDraft, setLocationDraft] = useState(() => ({
    label: auth?.user?.location_text || auth?.user?.location || "",
    latitude: auth?.user?.current_latitude != null ? Number(auth.user.current_latitude) : null,
    longitude: auth?.user?.current_longitude != null ? Number(auth.user.current_longitude) : null,
    placeId: auth?.user?.place_id || "",
  }));
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [visibleProvidersCount, setVisibleProvidersCount] = useState(INITIAL_VISIBLE_PROVIDERS);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const loadProviders = useCallback(async () => {
    if (!auth?.token) {
      setProviders([]);
      return;
    }
    setProvidersLoading(true);
    setProvidersError("");
    try {
      const customerLocation =
        auth?.user?.current_latitude != null && auth?.user?.current_longitude != null
          ? {
              latitude: Number(auth.user.current_latitude),
              longitude: Number(auth.user.current_longitude),
            }
          : null;
      const data = await listProviders(auth.token, undefined, dietTheme, customerLocation);
      setProviders(Array.isArray(data) ? data : []);
    } catch (error) {
      setProvidersError(error?.message || "Unable to load providers");
    } finally {
      setProvidersLoading(false);
    }
  }, [auth?.token, auth?.user?.current_latitude, auth?.user?.current_longitude, dietTheme]);

  useEffect(() => {
    if (!auth?.token) {
      setProviders([]);
      setSelectedProvider(null);
      return;
    }

    if (auth?.user?.current_latitude != null && auth?.user?.current_longitude != null) {
      loadProviders();
    } else {
      setProviders([]);
    }

    const handlePricingUpdated = () => loadProviders();
    const handleWindowFocus = () => loadProviders();
    window.addEventListener("pricingUpdated", handlePricingUpdated);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("pricingUpdated", handlePricingUpdated);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [auth?.token, auth?.user?.current_latitude, auth?.user?.current_longitude, loadProviders]);

  useEffect(() => {
    setLocationDraft({
      label: auth?.user?.location_text || auth?.user?.location || "",
      latitude: auth?.user?.current_latitude != null ? Number(auth.user.current_latitude) : null,
      longitude: auth?.user?.current_longitude != null ? Number(auth.user.current_longitude) : null,
      placeId: auth?.user?.place_id || "",
    });
  }, [auth?.user?.current_latitude, auth?.user?.current_longitude, auth?.user?.location, auth?.user?.location_text, auth?.user?.place_id]);

  useEffect(() => {
    setVisibleProvidersCount(INITIAL_VISIBLE_PROVIDERS);
  }, [providers, auth?.user?.location_text, auth?.user?.location, appliedSearch]);

  useEffect(() => {
    if (dietTheme !== "veg") {
      return;
    }

    if (selectedProvider && !providers.some((provider) => provider.provider_id === selectedProvider.provider_id)) {
      setSelectedProvider(null);
      setMenuItems([]);
      setProviderFeedback([]);
      setMenuError("");
      setFeedbackError("");
    }
  }, [dietTheme, providers, selectedProvider]);

  useEffect(() => {
    if (!selectedProvider || !auth?.token) {
      setMenuItems([]);
      setProviderFeedback([]);
      setMenuError("");
      setFeedbackError("");
      return;
    }

    let cancelled = false;

    const loadProviderDetails = async () => {
      setMenuLoading(true);
      setFeedbackLoading(true);
      setMenuError("");
      setFeedbackError("");

      const [menuResult, feedbackResult] = await Promise.allSettled([
        getProviderMenu(auth.token, selectedProvider.provider_id),
        getProviderFeedback(auth.token, selectedProvider.provider_id),
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
    };

    loadProviderDetails();

    return () => {
      cancelled = true;
    };
  }, [auth?.token, selectedProvider]);

  const groupedMenu = useMemo(() => {
    const grouped = {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
    };

    menuItems.forEach((item) => {
      const day = String(item.day || "").slice(0, 3).toUpperCase();
      const dishItems = Array.isArray(item.dish_items) && item.dish_items.length > 0
        ? item.dish_items
        : (Array.isArray(item.dishes) ? item.dishes.map((dish) => ({ name: dish, food_type: "veg" })) : []);
      const dishes = dishItems.length > 0
        ? dishItems
            .map((dish) => `${dish.food_type === "nonveg" ? "NV" : "V"} ${dish.name}`)
            .join(", ")
        : "Menu not available";
      const line = `${day}: ${dishes}`;
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(line);
      }
    });

    return grouped;
  }, [menuItems]);

  const searchSuggestions = useMemo(() => {
    const normalizedInput = searchInput.trim().toLowerCase();

    if (!normalizedInput) {
      return [];
    }

    const suggestions = new Set();

    providers.forEach((provider) => {
      const searchableParts = [
        provider?.mess_name,
        provider?.location,
        provider?.address,
        provider?.rating >= 4 ? "top rated" : "",
        provider?.weekly_price > 0 ? "weekly plan" : "",
        provider?.monthly_price > 0 ? "monthly plan" : "",
      ]
        .filter(Boolean)
        .map((value) => String(value).trim());

      searchableParts.forEach((part) => {
        if (part.toLowerCase().includes(normalizedInput)) {
          suggestions.add(part);
        }
      });

      String(provider?.mess_name || "")
        .split(/[\s,/-]+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && word.toLowerCase().includes(normalizedInput))
        .forEach((word) => suggestions.add(word));
    });

    return Array.from(suggestions).slice(0, 6);
  }, [providers, searchInput]);

  const filteredProviders = useMemo(() => {
    const normalizedSearch = appliedSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return providers;
    }

    const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);

    return [...providers]
      .map((provider) => {
        const searchableText = getProviderSearchText(provider);
        const matchScore = searchTerms.reduce((score, term) => {
          if (!searchableText.includes(term)) {
            return score;
          }

          if (String(provider?.mess_name || "").toLowerCase().includes(term)) {
            return score + 3;
          }

          return score + 1;
        }, 0);

        return { provider, matchScore };
      })
      .filter(({ matchScore }) => matchScore > 0)
      .sort((left, right) => {
        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }

        return Number(right.provider?.rating || 0) - Number(left.provider?.rating || 0);
      })
      .map(({ provider }) => provider);
  }, [appliedSearch, providers]);

  const hasSavedLocation =
    auth?.user?.current_latitude != null && auth?.user?.current_longitude != null;
  const visibleProviders = filteredProviders.slice(0, visibleProvidersCount);
  const canToggleProviders = filteredProviders.length > INITIAL_VISIBLE_PROVIDERS;
  const hasHiddenProviders = visibleProvidersCount < filteredProviders.length;

  const runProviderSearch = useCallback(() => {
    setAppliedSearch(searchInput.trim());
    setShowSuggestions(false);
  }, [searchInput]);
  const selectedProviderRating = Number(selectedProvider?.rating || 0).toFixed(1);

  const handleLocationSave = async () => {
    if (!locationDraft.label || locationDraft.latitude == null || locationDraft.longitude == null) {
      setLocationError("Choose a suggested location or use your current location before applying.");
      return;
    }

    setLocationSaving(true);
    setLocationError("");
    try {
      const updatedUser = await updateUserLocation(auth.token, {
        location_text: locationDraft.label,
        place_id: locationDraft.placeId || null,
        current_latitude: locationDraft.latitude,
        current_longitude: locationDraft.longitude,
      });
      onAuthUserUpdate?.(updatedUser);
    } catch (error) {
      setLocationError(error?.message || "Unable to save your location.");
    } finally {
      setLocationSaving(false);
    }
  };

  return (
    <section className="mess-providers" id="mess-providers">
      <div className="section-head">
        <h2>Find Mess Near you...</h2>
        <p className="lede">
          {dietTheme === "veg"
            ? "Veg mode is on. Showing only pure veg providers."
            : "Showing all providers, including veg and non-veg options."}
        </p>
      </div>

      <div className="providers-controls">
        <div className="location-panel">
          <div className="location-panel__content">
            <p className="location-panel__eyebrow">Delivery Location</p>
            <h3>Share your location to unlock nearby tiffin services</h3>
            <p className="location-panel__copy">
              Search your hostel, flat, PG, office, or landmark and we will only show mess providers that can
              actually deliver to you.
            </p>
            <div className="location-panel__benefits">
              <span className="location-panel__benefit">Live location</span>
              <span className="location-panel__benefit">Accurate radius match</span>
              <span className="location-panel__benefit">Faster discovery</span>
            </div>
          </div>
          <div className="location-panel__picker">
            <div className="location-panel__search-card">
              <p className="location-panel__search-label">Where should we deliver?</p>
              <LocationPicker
                label="Your location"
                placeholder="Search your address, locality, or landmark"
                value={locationDraft}
                onSelect={(location) => {
                  setLocationError("");
                  setLocationDraft(location);
                }}
                onError={setLocationError}
                allowCurrentLocation
              />
            </div>
            <button className="btn primary location-panel__save" onClick={handleLocationSave} disabled={locationSaving}>
              {locationSaving ? "Saving..." : hasSavedLocation ? "Update Location" : "Apply Location"}
            </button>
            {locationError && <p className="providers-state providers-state--error">{locationError}</p>}
            
          </div>
        </div>
      </div>

      {!selectedProvider && (
        <div className="provider-grid">
          {hasSavedLocation && (
            <div className="provider-grid__header">
              <span className="provider-grid__label">Selected address</span>
              <h3>{auth?.user?.location_text || auth?.user?.location}</h3>
            </div>
          )}
          {hasSavedLocation && providers.length > 0 && (
            <div className="provider-search">
              <label className="provider-search__label" htmlFor="provider-search-input">
                Fing your favourite tiffin service : 
              </label>
              <div className="provider-search__box">
                <input
                  id="provider-search-input"
                  type="text"
                  value={searchInput}
                  placeholder="Search by mess name or keyword"
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchInput.trim()) {
                      setShowSuggestions(true);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      runProviderSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  className="provider-search__trigger"
                  onClick={runProviderSearch}
                  aria-label="Search providers"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.44 1.41-1.42-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="provider-search__suggestions">
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="provider-search__suggestion"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSearchInput(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* {appliedSearch} */}
            </div>
          )}
          {!hasSavedLocation && (
            <p className="providers-state">
              Set your location first to discover providers that can deliver to you.
            </p>
          )}
          {providersLoading && <p className="providers-state">Loading providers...</p>}
          {!providersLoading && providersError && <p className="providers-state providers-state--error">{providersError}</p>}
          {!providersLoading && !providersError && hasSavedLocation && providers.length === 0 && (
            <p className="providers-state">No tiffin providers currently deliver to this location.</p>
          )}
          {!providersLoading && !providersError && hasSavedLocation && providers.length > 0 && filteredProviders.length === 0 && (
            <p className="providers-state">No providers matched your search. Try another keyword and click search.</p>
          )}

          {visibleProviders.length > 0 && (
            <div className={`provider-grid__list${appliedSearch ? " provider-grid__list--search" : ""}`}>
              {visibleProviders.map((provider) => (
                <article className="provider-card" key={provider.provider_id}>
                  <ProviderGallery provider={provider} />
                  <div className="provider-card__content">
                    <h3>{provider.mess_name}</h3>
                    <div className="provider-card__meta">
                      <div className="provider-card__meta-line">
                        <strong>Rating:</strong> <StarRating value={provider.rating} size="sm" showValue />
                      </div>
                      <p>
                        <strong>Category:</strong> {provider.provider_food_category === "pure_veg" ? "Pure Veg" : "Mixed (Veg + Non-Veg)"}
                      </p>
                      <p>
                        <strong>Contact:</strong> {String(provider.contact || "-")}
                      </p>
                    </div>
                    <div className="pricing-info">
                      {provider.weekly_price > 0 && (
                        <p><strong>Weekly:</strong> ₹{provider.weekly_price}/week</p>
                      )}
                      {provider.monthly_price > 0 && (
                        <p><strong>Monthly:</strong> ₹{provider.monthly_price}/month</p>
                      )}
                    </div>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn primary"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      Details
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setSelectedForSubscribe(provider);
                        setSubscribeModal(true);
                      }}
                      disabled={auth?.user?.role !== "customer" || !hasSavedLocation}
                      title={
                        auth?.user?.role !== "customer"
                          ? "Customers only"
                          : !hasSavedLocation
                            ? "Set your location first"
                            : "Subscribe to this plan"
                      }
                    >
                      Subscribe
                    </button>
                  </div>
                </article>
              ))}
              {canToggleProviders && (
                <button
                  type="button"
                  className="provider-card provider-card--toggle"
                  onClick={() =>
                    setVisibleProvidersCount((current) =>
                      current < filteredProviders.length
                        ? Math.min(current + PROVIDERS_LOAD_STEP, filteredProviders.length)
                        : INITIAL_VISIBLE_PROVIDERS
                    )
                  }
                >
                  <span className="provider-card__toggle-eyebrow">More Providers</span>
                  <strong>{hasHiddenProviders ? "Show More >>" : "<< Show Less"}</strong>
                  <span className="provider-card__toggle-copy">
                    {hasHiddenProviders
                      ? `${filteredProviders.length - visibleProvidersCount} more providers deliver here.`
                      : "Collapse back to the first 7 providers."}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {selectedProvider && (
        <div className="menu-details">
          <button
            className="btn ghost back-btn"
            onClick={() => setSelectedProvider(null)}
          >
            Back to all providers
          </button>

          <h3>{selectedProvider.mess_name} - Full Menu</h3>

          <div className="provider-details__intro">
            <div>
              <p><strong>Rating:</strong> <StarRating value={selectedProvider.rating} size="sm" showValue /></p>
              <p><strong>Category:</strong> {selectedProvider.provider_food_category === "pure_veg" ? "Pure Veg" : "Mixed (Veg + Non-Veg)"}</p>
              <p><strong>Contact:</strong> {selectedProvider.contact}</p>
            </div>
            <div>
              {selectedProvider.weekly_price > 0 && <p><strong>Weekly:</strong> ₹{selectedProvider.weekly_price}/week</p>}
              {selectedProvider.monthly_price > 0 && <p><strong>Monthly:</strong> ₹{selectedProvider.monthly_price}/month</p>}
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
                  <strong>{selectedProviderRating}</strong>
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
      )}

      <SubscribeModal
        auth={auth}
        provider={selectedForSubscribe}
        isOpen={subscribeModal}
        onClose={() => {
          setSubscribeModal(false);
          setSelectedForSubscribe(null);
        }}
        onSubscribeSuccess={() => {
          setSubscribeModal(false);
          setSelectedForSubscribe(null);
          loadProviders();
          window.dispatchEvent(new CustomEvent("subscriptionCreated"));
          onSubscriptionCreated?.();
        }}
      />
    </section>
  );
}

export default MessProviders;
