import { useState } from "react";
import "./LoginModal.css";

// Placeholder destination for provider dashboard
const PROVIDER_PORTAL_URL = "https://provider.tiffindelight.com";

function ProviderLoginModal({ onBack, onClose }) {
  const [form, setForm] = useState({
    businessName: "",
    providerId: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder action: open the provider portal in a new tab
    window.open(PROVIDER_PORTAL_URL, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <button className="modal-back" onClick={onBack}>
          ← Back
        </button>

        <div className="modal-accent" />
        <h2 className="modal-title">Provider Login</h2>
        <p className="modal-subtitle">
          Access your tiffin service dashboard
        </p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="prov-business">Business Name</label>
            <input
              id="prov-business"
              name="businessName"
              type="text"
              placeholder="e.g. Sharma Tiffin Services"
              value={form.businessName}
              onChange={handleChange}
              autoComplete="organization"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-id">Provider ID</label>
            <input
              id="prov-id"
              name="providerId"
              type="text"
              placeholder="e.g. TFD-2024-00123"
              value={form.providerId}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-email">Email Address</label>
            <input
              id="prov-email"
              name="email"
              type="email"
              placeholder="business@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-password">Password</label>
            <input
              id="prov-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="modal-submit">
            Log In to Provider Dashboard
          </button>
        </form>

        <hr className="modal-divider" />
        <p className="modal-footnote">
          New provider? Register on the provider portal.
        </p>
      </div>
    </div>
  );
}

export default ProviderLoginModal;
