import SectionHead from "./SectionHead";

const features = [
  { title: "Flexible plans", copy: "Daily, weekly, or monthly tiffins. Pause or resume any time." },
  { title: "Hygienic kitchens", copy: "FSSAI compliant prep, sealed packaging, and temperature-safe delivery." },
  { title: "Smart delivery", copy: "Live tracking with delivery window reminders so you never miss a meal." },
  { title: "Veg & Jain options", copy: "Separate prep lines to keep dietary preferences fully respected." },
];

function About() {
  return (
    <section className="about" id="about">
      <SectionHead
        eyebrow="Why Tiffin Delight"
        title="Built for busy students and offices"
        text="Transparent plans, doorstep delivery, and flexible pausing. We focus on balanced meals—right portions, fresh produce, and minimal oil."
      />
      <div className="feature-grid">
        {features.map((item) => (
          <div className="feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default About;
