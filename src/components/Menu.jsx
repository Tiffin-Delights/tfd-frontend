import SectionHead from "./SectionHead";

const dishes = [
  "Dal Tadka & Veg Pulao",
  "Chole Masala with Bhatura",
  "Palak Paneer & Jeera Rice",
  "Veg Biryani with Raita",
  "Aloo Gobi with Phulka",
  "Kadhi Pakoda & Steamed Rice",
];

function Menu() {
  return (
    <section className="menu" id="menu">
      <SectionHead eyebrow="Sample rotation" title="This week’s highlights" />
      <div className="menu-grid">
        {dishes.map((dish) => (
          <div className="menu-card" key={dish}>
            <div className="dish">{dish}</div>
            <p>Served with salad and chutney. Jain/less oil options available.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Menu;
