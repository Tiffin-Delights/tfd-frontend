import { useEffect, useState } from "react";
import SectionHead from "./SectionHead";

const features = [
  { title: "Flexible plans", copy: "Daily, weekly, or monthly tiffins. Pause or resume any time." },
  { title: "Hygienic kitchens", copy: "FSSAI compliant prep, sealed packaging, and temperature-safe delivery." },
  { title: "Smart delivery", copy: "Live tracking with delivery window reminders so you never miss a meal." },
  { title: "Veg & Jain options", copy: "Separate prep lines to keep dietary preferences fully respected." },
];

function About() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || isFlipping || features.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setIsFlipping(true);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isFlipping, isPaused]);

  useEffect(() => {
    if (!isFlipping) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
      setIsFlipping(false);
    }, 1050);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipping]);

  return (
    <section className="about" id="about">
      <SectionHead
        // eyebrow="Why Tiffin Delight
        title="Built for busy students and offices"
        text="Transparent plans, doorstep delivery, and flexible pausing. We focus on balanced meals—right portions, fresh produce, and minimal oil."
      />
      <div className="feature-grid">
        <button
          type="button"
          className="feature-book"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onClick={() => setIsPaused((prev) => !prev)}
          aria-pressed={isPaused}
          aria-label={`${features[activeIndex].title}. ${isPaused ? "Resume" : "Pause"} page turn animation.`}
        >
          <span className="feature-book-frame" aria-hidden="true" />
          <span className="feature-card-stack">
            {features.map((item, index) => {
              const distance = (index - activeIndex + features.length) % features.length;
              const className = [
                "feature-page",
                distance === 0 ? "is-active" : "",
                distance === 1 ? "is-next" : "",
                distance > 1 ? "is-stacked" : "",
                distance === 0 && isFlipping ? "is-turning" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <span className={className} key={item.title}>
                  <span className="feature-page-glow" />
                  <span className="feature-page-content">
                    <span className="feature-page-count">0{index + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </span>
                </span>
              );
            })}
          </span>
          <span className="feature-card-meta">
            {/* <span className="feature-card-kicker">Page-turn overview</span> */}
            <span className="feature-card-dots" aria-hidden="true">
              {features.map((item, index) => (
                <span className={index === activeIndex ? "is-active" : ""} key={item.title} />
              ))}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}

export default About;
