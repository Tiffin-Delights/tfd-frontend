import { useEffect, useMemo, useState } from "react";
import SectionHead from "./SectionHead";

const createIllustration = ({ accent, labelColor, bgStart, bgEnd, panelEnd, label, icon }) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${bgStart}" />
          <stop offset="100%" stop-color="${bgEnd}" />
        </linearGradient>
        <linearGradient id="panel" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96" />
          <stop offset="100%" stop-color="${panelEnd}" stop-opacity="0.88" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="28" fill="url(#bg)" />
      <circle cx="86" cy="84" r="42" fill="${accent}" opacity="0.16" />
      <circle cx="238" cy="66" r="24" fill="${accent}" opacity="0.12" />
      <rect x="54" y="42" width="212" height="136" rx="24" fill="url(#panel)" />
      <rect x="54.5" y="42.5" width="211" height="135" rx="23.5" fill="none" stroke="${accent}" stroke-opacity="0.22" />
      <text x="160" y="102" text-anchor="middle" font-size="42">${icon}</text>
      <text
        x="160"
        y="148"
        text-anchor="middle"
        font-size="20"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="${labelColor}"
      >
        ${label}
      </text>
    </svg>
  `)}`;

function RoadmapLane({ audience, title, steps }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (steps.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length);
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [steps.length]);

  return (
    <article className="roadmap-lane">
      <div className="roadmap-lane-head">
        <h3>{title}</h3>
      </div>
      <div className="roadmap-track">
        {steps.map((step, index) => (
          <div
            className={`roadmap-card ${index === activeIndex ? "is-active" : "is-faded"}`}
            key={`${audience}-${step.title}`}
          >
            <span className="roadmap-spotlight" aria-hidden="true" />
            <span className="roadmap-step-badge">0{index + 1}</span>
            <img className="roadmap-image" src={step.image} alt={step.title} />
            <div className="roadmap-copy">
              <h4>{step.title}</h4>
              <p>{step.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HowItWorks({ dietTheme = "nonveg" }) {
  const illustrationTheme = useMemo(() => {
    if (dietTheme === "veg") {
      return {
        bgStart: "#f8fff6",
        bgEnd: "#dff3dc",
        panelEnd: "#f0fbec",
        labelColor: "#2f7a45",
        accents: ["#8fca8a", "#76bc86", "#9ed49a", "#67a973"],
      };
    }

    return {
      bgStart: "#fffaf2",
      bgEnd: "#ffe7bf",
      panelEnd: "#fff9ef",
      labelColor: "#7d2f37",
      accents: ["#f5c476", "#f0b95c", "#f2c786", "#f1b46b"],
    };
  }, [dietTheme]);

  const consumerSteps = [
    {
      title: "Sign Up",
      copy: "Create your account",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[0], label: "Quick Start", icon: "🧑" }),
    },
    {
      title: "Find Provider",
      copy: "Discover nearby kitchens",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[1], label: "Near You", icon: "📍" }),
    },
    {
      title: "Subscribe",
      copy: "Choose your meal plan",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[2], label: "Meal Plan", icon: "🍱" }),
    },
    {
      title: "Cancel Food",
      copy: "Skip meals on some days",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[3], label: "Skip Days", icon: "📅" }),
    },
  ];

  const providerSteps = [
    {
      title: "Join Portal",
      copy: "Open provider dashboard",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[0], label: "Provider Entry", icon: "🏪" }),
    },
    {
      title: "Add Menu",
      copy: "Upload meals daily",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[1], label: "Menu Setup", icon: "📝" }),
    },
    {
      title: "Manage Orders",
      copy: "Accept orders smoothly",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[2], label: "Order Flow", icon: "📦" }),
    },
    {
      title: "Grow Reach",
      copy: "Build trust faster",
      image: createIllustration({ ...illustrationTheme, accent: illustrationTheme.accents[3], label: "Review Boost", icon: "📈" }),
    },
  ];

  return (
    <section className="flow" id="process">
      <SectionHead
        title="Daily Tiffin Flow"
        text="Customers find meals; providers manage menus, orders, and subscribers smoothly."
      />
      <div className="roadmap-board">
        <RoadmapLane title="Order your tiffin" steps={consumerSteps} />
        <RoadmapLane title="Run your kitchen" steps={providerSteps} />
      </div>
    </section>
  );
}

export default HowItWorks;
