import { useEffect, useState } from "react";
import SectionHead from "./SectionHead";

const testimonials = [
  {
    quote: "“Portions are perfect for office lunch and always on time.”",
    name: "Ritika",
    designation: "Tech Park",
  },
  {
    quote: "“Menu rotates enough that I don’t get bored. Support responds fast.”",
    name: "Sameer",
    designation: "MBA Student",
  },
  {
    quote: "“The pause/resume feature is a lifesaver during travel.”",
    name: "Vikram",
    designation: "Consultant",
  },
];

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="social-proof" id="reviews">
      <SectionHead eyebrow="Loved by subscribers" title="Listen what people are saying.." />
      <div className="testimonial-container">
        <article className="testimonial-card" key={currentIndex}>
          <div className="testimonial-content">
            <p>{currentTestimonial.quote}</p>
            <div className="testimonial-author">
              <span className="name">{currentTestimonial.name}</span>
              <span className="designation">{currentTestimonial.designation}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Testimonials;
