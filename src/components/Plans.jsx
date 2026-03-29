import { useState } from "react";
import SectionHead from "./SectionHead";
import ProviderLoginModal from "./Auth/ProviderLoginModal";

const plans = [
  {
    name: "One-time order",
    price: "₹99",
    per: "/meal",
    points: ["Single order (no commitment)", "Choose any 3 dishes", "Delivered once"],
    cta: "Try a one-time meal",
    highlight: false,
  },
  {
    name: "Weekly subscription",
    price: "₹129",
    per: "/meal",
    points: ["Best for regular meals", "Pause / resume anytime", "Free delivery on 5+ meals"],
    cta: "Subscribe weekly",
    highlight: true,
  },
  {
    name: "Monthly subscription",
    price: "₹149",
    per: "/meal",
    points: ["Most value per meal", "Priority menu swaps", "Flexible delivery days"],
    cta: "Subscribe monthly",
    highlight: false,
  },
];

function Plans() {
  const [providerLoginOpen, setProviderLoginOpen] = useState(false);

  return (
    <section className="plans" id="plans">
      <SectionHead
        eyebrow="Pick a plan"
        title="Simple pricing that fits your routine"
        text="Choose your slot, cuisines, and delivery days. Swap dishes anytime."
      />
      <div className="plan-grid">
        {plans.map((plan) => (
          <div className={`plan-card ${plan.highlight ? "highlight" : ""}`} key={plan.name}>
            <h3>{plan.name}</h3>
            <p className="price">
              {plan.price}
              <span>{plan.per}</span>
            </p>
            <ul>
              {plan.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
            <button className={`btn block ${plan.highlight ? "primary" : ""}`}>{plan.cta}</button>
          </div>
        ))}
      </div>

      <div className="provider-cta">
        <p>
          Want to partner with us? Register as a provider to see your
          dashboard and pricing tools.
        </p>
        <div className="provider-controls">
          <button
            className="btn primary"
            onClick={() => setProviderLoginOpen(true)}
          >
            Provider login / register
          </button>
        </div>
      </div>

      {providerLoginOpen && (
        <ProviderLoginModal
          onBack={() => setProviderLoginOpen(false)}
          onClose={() => setProviderLoginOpen(false)}
        />
      )}
    </section>
  );
}

export default Plans;
