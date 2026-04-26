import { useEffect, useState } from "react";
import SectionHead from "./SectionHead";

const highlights = [
  {
    name: "Find Nearby Tiffin Providers",
    note: "Customers can discover home-style meal providers near their location and compare plans before subscribing.",
  },
  {
    name: "Flexible Weekly And Monthly Plans",
    note: "Choose a subscription that fits your routine, budget, and meal needs without a complicated ordering process.",
  },
  {
    name: "Skip Meals When You Need",
    note: "Users can cancel food for selected days, helping avoid waste and giving more control over daily deliveries.",
  },
  {
    name: "Manage Orders In One Dashboard",
    note: "Providers can update menus, pricing, service area, photos, orders, and subscribers from one place.",
  },
  {
    name: "Build Trust With Ratings And Feedback",
    note: "Reviews, customer feedback, and provider details help both sides make better decisions with confidence.",
  },
];

function Menu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || isFlipping || highlights.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setIsFlipping(true);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isFlipping, isPaused]);

  useEffect(() => {
    if (!isFlipping) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % highlights.length);
      setIsFlipping(false);
    }, 1050);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipping]);

  return (
    <section className="menu" id="menu">
      <SectionHead
        title="Why this platform works for customers and providers"
        text="From finding nearby tiffin services to managing subscriptions, menus, and delivery updates, these highlights show how the platform supports everyday meal routines."
      />
      <div className="menu-grid">
        <button
          type="button"
          className="menu-book"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onClick={() => setIsPaused((prev) => !prev)}
          aria-pressed={isPaused}
          aria-label={`${highlights[activeIndex].name}. ${isPaused ? "Resume" : "Pause"} page turn animation.`}
        >
          <span className="menu-book-frame" aria-hidden="true" />
          <span className="menu-card-stack">
            {highlights.map((item, index) => {
              const distance = (index - activeIndex + highlights.length) % highlights.length;
              const className = [
                "menu-page",
                distance === 0 ? "is-active" : "",
                distance === 1 ? "is-next" : "",
                distance > 1 ? "is-stacked" : "",
                distance === 0 && isFlipping ? "is-turning" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <span className={className} key={item.name}>
                  <span className="menu-page-glow" />
                  <span className="menu-page-content">
                    <span className="menu-page-count">0{index + 1}</span>
                    <div className="dish">{item.name}</div>
                    <p>{item.note}</p>
                  </span>
                </span>
              );
            })}
          </span>
          <span className="menu-card-meta">
            {/* <span className="menu-card-kicker">Rotating highlights</span> */}
            <span className="menu-card-dots" aria-hidden="true">
              {highlights.map((item, index) => (
                <span className={index === activeIndex ? "is-active" : ""} key={item.name} />
              ))}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}

export default Menu;
