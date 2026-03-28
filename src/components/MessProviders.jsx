import { useCallback, useEffect, useMemo, useState } from "react";
import "./MessProviders.css";
import { getProviderMenu, listProviders, updateUserLocation } from "../api/client";
import SubscribeModal from "./MessProviders/SubscribeModal";
import LocationPicker from "./Location/LocationPicker";
import StarRating from "./common/StarRating";

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

const EMPTY_PHOTOS = [];

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

function MessProviders({ auth, onSubscriptionCreated, onAuthUserUpdate, dietTheme = "nonveg" }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [menuError, setMenuError] = useState("");
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
    if (dietTheme !== "veg") {
      return;
    }

    if (selectedProvider && !providers.some((provider) => provider.provider_id === selectedProvider.provider_id)) {
      setSelectedProvider(null);
      setMenuItems([]);
      setMenuError("");
    }
  }, [dietTheme, providers, selectedProvider]);

  useEffect(() => {
    if (!selectedProvider || !auth?.token) {
      setMenuItems([]);
      setMenuError("");
      return;
    }

    const loadMenu = async () => {
      setMenuLoading(true);
      setMenuError("");
      try {
        const data = await getProviderMenu(auth.token, selectedProvider.provider_id);
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (error) {
        setMenuError(error?.message || "Unable to load menu");
      } finally {
        setMenuLoading(false);
      }
    };

    loadMenu();
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
      const dishes = Array.isArray(item.dishes) ? item.dishes.join(", ") : "Menu not available";
      const line = `${day}: ${dishes}`;
      if (grouped[item.meal_type]) {
        grouped[item.meal_type].push(line);
      }
    });

    return grouped;
  }, [menuItems]);

  const hasSavedLocation =
    auth?.user?.current_latitude != null && auth?.user?.current_longitude != null;

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
        <p className="eyebrow">Mess Providers</p>
        <h2>Choose Your Mess</h2>
        <p className="lede">
          {dietTheme === "veg"
            ? "Veg mode is on, so suggestions only show providers that appear to offer vegetarian meals."
            : "Click on Details to see the full menu of any mess provider."}
        </p>
      </div>

      <div className="providers-controls">
        <div className="location-panel">
          <div>
            <p className="location-panel__eyebrow">Delivery Location</p>
            <h3>Share your location to see nearby tiffin services</h3>
            <p className="location-panel__copy">
              Use live location or search manually. We only show providers whose delivery radius covers your spot.
            </p>
          </div>
          <div className="location-panel__picker">
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
            <button className="btn primary location-panel__save" onClick={handleLocationSave} disabled={locationSaving}>
              {locationSaving ? "Saving..." : hasSavedLocation ? "Update Location" : "Apply Location"}
            </button>
            {locationError && <p className="providers-state providers-state--error">{locationError}</p>}
            {hasSavedLocation && (
              <p className="location-panel__saved">
                Showing providers near <strong>{auth?.user?.location_text || auth?.user?.location}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {!selectedProvider && (
        <div className="provider-grid">
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

          {providers.map((provider) => (
            <article className="provider-card" key={provider.provider_id}>
              <ProviderGallery provider={provider} />
              <div className="provider-card__content">
                <h3>{provider.mess_name}</h3>
                <div className="provider-card__meta">
                  <p>
                    <strong>Rating:</strong> <StarRating value={provider.rating} size="sm" showValue />
                  </p>
                  <p>
                    <strong>Contact:</strong> {provider.contact}
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
