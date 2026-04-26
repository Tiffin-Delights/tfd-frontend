import { useEffect, useState } from "react";
import SectionHead from "./SectionHead";
import { listPublicTopProviders } from "../api/client";

function formatRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0.0";
  }
  return numeric.toFixed(1);
}

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "NA";
  }
  return `Rs ${numeric.toFixed(0)}`;
}

function getAddress(provider) {
  return provider?.service_address_text || provider?.city || "Address not added";
}

function Testimonials({ dietTheme = "nonveg", onOpenProvider }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTopProviders() {
      try {
        setLoading(true);
        setError("");
        const response = await listPublicTopProviders(5, dietTheme);

        if (!cancelled) {
          setProviders(response);
          setCurrentIndex(0);
        }
      } catch (err) {
        if (!cancelled) {
          setProviders([]);
          setError(err.message || "Unable to load top providers");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTopProviders();

    return () => {
      cancelled = true;
    };
  }, [dietTheme]);

  useEffect(() => {
    if (providers.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % providers.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [providers]);

  const currentProvider = providers[currentIndex];

  return (
    <section className="social-proof" id="reviews">
      <SectionHead
        title="Top Rated Providers"
        text="Top 5 tiffin providers trusted by subscribers."
      />

      {loading ? (
        <div className="testimonial-status">Loading top providers...</div>
      ) : error ? (
        <div className="testimonial-status testimonial-status--error">{error}</div>
      ) : !currentProvider ? (
        <div className="testimonial-status">No providers available right now.</div>
      ) : (
        <div className="testimonial-container">
          <article
            className="testimonial-card"
            key={currentProvider.provider_id}
            onClick={() => onOpenProvider?.(currentProvider.provider_id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenProvider?.(currentProvider.provider_id);
              }
            }}
            aria-label={`Open details for ${currentProvider.mess_name}`}
          >
            <div className="testimonial-card__shell">
              <div className="testimonial-media">
                {currentProvider.photo_urls?.[0] ? (
                  <img
                    src={currentProvider.photo_urls[0]}
                    alt={`${currentProvider.mess_name} cover`}
                  />
                ) : (
                  <div className="testimonial-media__fallback">
                    <span>{currentProvider.mess_name}</span>
                  </div>
                )}
              </div>

              <div className="testimonial-content">
                <p>{currentProvider.mess_name}</p>
                <div className="testimonial-author">
                  <span className="name">{currentProvider.owner_name}</span>
                  <span className="designation">{getAddress(currentProvider)}</span>
                </div>
                <div className="testimonial-meta">
                  <span>Top 0{currentIndex + 1}</span>
                  <span>⭐ {formatRating(currentProvider.rating)}</span>
                  <span>Weekly {formatPrice(currentProvider.weekly_price)}</span>
                  <span>Monthly {formatPrice(currentProvider.monthly_price)}</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default Testimonials;
