import { useState, useEffect } from "react";
import SectionHead from "./SectionHead";
import feedbackImage from "../assets/feedback.png";

const testimonials = [
  { quote: "“Portions are perfect for office lunch and always on time.”", name: "Ritika", designation: "Tech Park" },
  { quote: "“Menu rotates enough that I don’t get bored. Support responds fast.”", name: "Sameer", designation: "MBA Student" },
  { quote: "“The pause/resume feature is a lifesaver during travel.”", name: "Vikram", designation: "Consultant" },
];

function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="social-proof" id="reviews">
      <SectionHead eyebrow="Loved by subscribers" title="People stay for the consistency" />
      <div className="testimonial-container">
        <div className="testimonial-card" key={currentIndex}>
          <p>{testimonials[currentIndex].quote}</p>
          <div className="testimonial-author">
            <span className="name">{testimonials[currentIndex].name}</span>
            <span className="designation">{testimonials[currentIndex].designation}</span>
          </div>
        </div>
        <div className="testimonial-image">
          <img src={feedbackImage} alt="Feedback" />
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
