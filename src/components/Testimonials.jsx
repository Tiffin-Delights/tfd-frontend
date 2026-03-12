import SectionHead from "./SectionHead";

const testimonials = [
  { quote: "“Portions are perfect for office lunch and always on time.”", name: "Ritika, Tech Park" },
  { quote: "“Menu rotates enough that I don’t get bored. Support responds fast.”", name: "Sameer, MBA student" },
  { quote: "“The pause/resume feature is a lifesaver during travel.”", name: "Vikram, Consultant" },
];

function Testimonials() {
  return (
    <section className="social-proof" id="reviews">
      <SectionHead eyebrow="Loved by subscribers" title="People stay for the consistency" />
      <div className="testimonial-grid">
        {testimonials.map((item) => (
          <div className="testimonial" key={item.name}>
            <p>{item.quote}</p>
            <span className="name">{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
