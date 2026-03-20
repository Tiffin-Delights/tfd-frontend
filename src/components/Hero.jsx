import tfn from "../assets/tfn.jpg";
import vegImage from "../assets/veg.jpeg";

function Hero({ dietTheme = "nonveg" }) {
  const heroImage = dietTheme === "veg" ? vegImage : tfn;

  return (
    <section className="hero" id="home">
      <div className="hero__content">
        <p className="eyebrow">Healthy. Fresh. On time.</p>
        <h1>Khaooo! <span className="reveal-text">Ghar Jaisa . .</span></h1>
        <p className="lede">
          Pick your plan, lock your timings, and let us handle the rest.
          No minimums, easy pausing, and chef-made menus that rotate daily.
        </p>
        {/* <div className="hero__cta">
          <a href="#plans" className="btn primary snake-btn">
            <span className="snake-btn__border" aria-hidden="true" />
            <span className="snake-btn__content">Choose your plan</span>
          </a>
          <a href="#contact" className="btn ghost snake-btn">
            <span className="snake-btn__border" aria-hidden="true" />
            <span className="snake-btn__content">Talk to us</span>
          </a>
        </div> */}
        <div className="hero__stats">
          <div>
            <span className="stat-number">1200+</span>
            <span className="stat-label">Meals served weekly</span>
          </div>
          <div>
            <span className="stat-number">35 min</span>
            <span className="stat-label">Average delivery time</span>
          </div>
          <div>
            <span className="stat-number">4.8★</span>
            <span className="stat-label">Customer rating</span>
          </div>
        </div>
      </div>
      <div className="hero__card">
        {/* <h3>Today’s Tiffin</h3>
        <ul>
          <li><span>Paneer Lababdar</span><span className="pill">Protein</span></li>
          <li><span>Jeera Rice</span><span className="pill">Light</span></li>
          <li><span>Phulka (2)</span><span className="pill">Whole wheat</span></li>
          <li><span>Cucumber Raita</span><span className="pill">Cool</span></li>
        </ul> */}
        <img src={heroImage} alt="Today's Tiffin" className="tiffin-image" />
      </div>
    </section>
  );
}

export default Hero;
