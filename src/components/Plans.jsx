import SectionHead from "./SectionHead";

const plans = [
  {
    name: "Starter",
    price: "₹99",
    per: "/meal",
    points: ["1 sabzi + rice/roti", "Salad & raita", "Choose 3 days/week"],
    cta: "Start 3-day trial",
    highlight: false,
  },
  {
    name: "Balanced",
    price: "₹129",
    per: "/meal",
    points: ["2 sabzi + rice & roti", "Dal + dessert twice a week", "5 days/week"],
    cta: "Subscribe weekly",
    highlight: true,
  },
  {
    name: "Premium",
    price: "₹159",
    per: "/meal",
    points: ["Chef specials & high-protein", "Unlimited swaps", "Weekend deliveries included"],
    cta: "Book a tasting",
    highlight: false,
  },
];

function Plans() {
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
    </section>
  );
}

export default Plans;
