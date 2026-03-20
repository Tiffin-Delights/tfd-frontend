import { useState } from "react";
import "./LoginModal.css";
import { loginUser, registerUser } from "../../api/client";

function CustomerSignupModal({ onBack, onClose, onSignupSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    delivery_address: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);

      await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: "customer",
        location: form.location.trim() || null,
        delivery_address: form.delivery_address.trim(),
      });

      const loginResult = await loginUser(form.email.trim(), form.password);
      onSignupSuccess?.(loginResult);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--large" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <button className="modal-back" onClick={onBack}>
          ← Back
        </button>

        <div className="modal-accent" />
        <h2 className="modal-title">Customer Sign Up</h2>
        <p className="modal-subtitle">Create your account for subscription-based meal plans</p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="cust-signup-name">Full Name</label>
            <input
              id="cust-signup-name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-signup-email">Email Address</label>
            <input
              id="cust-signup-email"
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
            <label htmlFor="cust-signup-phone">Phone Number</label>
            <input
              id="cust-signup-phone"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-signup-location">City / Location</label>
            <input
              id="cust-signup-location"
              name="location"
              type="text"
              placeholder="e.g. Indore"
              value={form.location}
              onChange={handleChange}
              autoComplete="address-level2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-signup-address">Delivery Address</label>
            <textarea
              id="cust-signup-address"
              name="delivery_address"
              placeholder="Flat, building, street, landmark"
              value={form.delivery_address}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-signup-password">Password</label>
            <input
              id="cust-signup-password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cust-signup-confirm">Confirm Password</label>
            <input
              id="cust-signup-confirm"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Customer Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustomerSignupModal;
