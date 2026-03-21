import { useEffect, useState } from "react";
import SectionHead from "./SectionHead";

const dishes = [
  {
    name: "Dal Tadka & Veg Pulao",
    note: "Served with salad and chutney. Jain and less-oil options available.",
  },
  {
    name: "Chole Masala with Bhatura",
    note: "Freshly packed with crunchy onion salad and a side of mint chutney.",
  },
  {
    name: "Palak Paneer & Jeera Rice",
    note: "Balanced lunch box with soft paneer, jeera rice, and a seasonal side.",
  },
  {
    name: "Veg Biryani with Raita",
    note: "Fragrant basmati biryani with cooling raita and house-made pickle.",
  },
  {
    name: "Aloo Gobi with Phulka",
    note: "Homestyle comfort meal with soft phulkas and fresh-cut salad.",
  },
  {
    name: "Kadhi Pakoda & Steamed Rice",
    note: "A hearty classic with steamed rice, pakoda kadhi, and crunchy accompaniment.",
  },
];

function Menu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || isFlipping || dishes.length <= 1) {
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
      setActiveIndex((prev) => (prev + 1) % dishes.length);
      setIsFlipping(false);
    }, 1050);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipping]);

  return (
    <section className="menu" id="menu">
      <SectionHead eyebrow="OUR" title="Top Providers" />
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
          aria-label={`${dishes[activeIndex].name}. ${isPaused ? "Resume" : "Pause"} page turn animation.`}
        >
          <span className="menu-book-frame" aria-hidden="true" />
          <span className="menu-card-stack">
            {dishes.map((dish, index) => {
              const distance = (index - activeIndex + dishes.length) % dishes.length;
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
                <span className={className} key={dish.name}>
                  <span className="menu-page-glow" />
                  <span className="menu-page-content">
                    <span className="menu-page-count">0{index + 1}</span>
                    <div className="dish">{dish.name}</div>
                    <p>{dish.note}</p>
                  </span>
                </span>
              );
            })}
          </span>
          <span className="menu-card-meta">
            {/* <span className="menu-card-kicker">Rotating highlights</span> */}
            <span className="menu-card-dots" aria-hidden="true">
              {dishes.map((dish, index) => (
                <span className={index === activeIndex ? "is-active" : ""} key={dish.name} />
              ))}
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}

export default Menu;
