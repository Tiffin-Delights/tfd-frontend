import SectionHead from "./SectionHead";

const steps = [
  { title: "Set your schedule", copy: "Pick delivery slot, address, and dietary preferences." },
  { title: "Lock your plan", copy: "Confirm weekly menu or let us auto-rotate chef picks." },
  { title: "Track & enjoy", copy: "Get ETA, delivery partner details, and meal ratings after every drop." },
];

function HowItWorks() {
  return (
    <section className="flow" id="process">
      <SectionHead eyebrow="How it works" title="Three steps to your daily tiffin" />
      <div className="stepper">
        {steps.map((step, idx) => (
          <div className="step" key={step.title}>
            <span className="step-number">{idx + 1}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
