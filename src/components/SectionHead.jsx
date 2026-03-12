function SectionHead({ eyebrow, title, text, align = "center" }) {
  return (
    <div className="section-head" style={{ textAlign: align }}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {text && <p className="section-text">{text}</p>}
    </div>
  );
}

export default SectionHead;
