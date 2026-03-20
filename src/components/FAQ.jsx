import SectionHead from "./SectionHead";
import Footer from "./Footer/footer";

const faqs = [
  { q: "Can I pause mid-week?", a: "Yes, pause or skip a day before 9 PM for zero charge." },
  { q: "Do you deliver on weekends?", a: "Included in Premium; add-on available for other plans." },
  { q: "Is packaging sustainable?", a: "We use recyclable containers; steel tiffins available on request." },
  { q: "Can I change address mid-week?", a: "Yes, update address before 9 PM for next-day delivery." },
  { q: "Do you have Jain meals?", a: "Yes, prepared on separate lines with no root vegetables." },
];

function FAQ() {
  return (
    <section className="faq" id="faq">
      <div className="faq-contact">
        <div className="faq-panel">
          <div className="faq-header">
            <SectionHead title="Quick answers" align="left" />
          </div>
          <div className="faq-scroll">
            <div className="faq-list">
              {faqs.map((item) => (
                <div className="faq-item" key={item.q}>
                  <h4>{item.q}</h4>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* <div className="cta-card contact-card">
          <h2>Ready for your first tiffin?</h2>
          <p>Share your slot and location. We’ll confirm within 10 minutes.</p>
          <form className="cta-form">
            <div className="field">
              <label>Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" placeholder="10-digit mobile" />
            </div>
            <div className="field">
              <label>Area / Campus</label>
              <input type="text" placeholder="Eg. Manyata Tech Park" />
            </div>
            <div className="field">
              <label>Preferred slot</label>
              <select>
                <option>Lunch (12-2 PM)</option>
                <option>Dinner (7-9 PM)</option>
              </select>
            </div>
            <button type="button" className="btn primary block">Request a callback</button>
            {/* <p className="note">We respond on WhatsApp & SMS during working hours.</p> */}
         
      </div>

      <Footer />
    </section>
  );
}

export default FAQ;
