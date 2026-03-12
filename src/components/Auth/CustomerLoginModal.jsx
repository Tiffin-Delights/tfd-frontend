import { useState } from "react";
import "./LoginModal.css";

// Placeholder destination for customer portal
const CUSTOMER_PORTAL_URL = "https://customer.tiffindelight.com";

function CustomerLoginModal({ onBack, onClose }) {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder action: open the customer portal in a new tab
    window.open(CUSTOMER_PORTAL_URL, "_blank", "noopener,noreferrer");
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
        <h2 className="modal-title">Customer Login</h2>
        <p className="modal-subtitle">Sign in to manage your tiffin orders</p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="cust-email">Email Address</label>
            <input
              id="cust-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-password">Password</label>
            <input
              id="cust-password"
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
            Log In to My Account
          </button>
        </form>

        <hr className="modal-divider" />
        <p className="modal-footnote">
          New here? Sign up on the customer portal.
        </p>
      </div>
    </div>
  );
}

export default CustomerLoginModal;
