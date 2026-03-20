import { useState } from "react";
import "./LoginModal.css";
import { loginUser, registerUser } from "../../api/client";

function ProviderSignupModal({ onBack, onClose, onSignupSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    mess_name: "",
    city: "",
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
        role: "provider",
        location: form.city.trim(),
        delivery_address: form.delivery_address.trim() || null,
        mess_name: form.mess_name.trim(),
        city: form.city.trim(),
        contact: form.phone.trim(),
      });

      const loginResult = await loginUser(form.email.trim(), form.password);
      onSignupSuccess?.(loginResult);
      onClose();
    } catch (err) {
      setError(err.message || "Provider registration failed. Please try again.");
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
        <h2 className="modal-title">Provider Sign Up</h2>
        <p className="modal-subtitle">Create your mess account and start selling subscriptions</p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="prov-signup-owner">Owner Name</label>
            <input
              id="prov-signup-owner"
              name="name"
              type="text"
              placeholder="Owner full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-signup-mess">Mess / Restaurant Name</label>
            <input
              id="prov-signup-mess"
              name="mess_name"
              type="text"
              placeholder="Your business name"
              value={form.mess_name}
              onChange={handleChange}
              autoComplete="organization"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-signup-email">Email Address</label>
            <input
              id="prov-signup-email"
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
            <label htmlFor="prov-signup-phone">Phone Number</label>
            <input
              id="prov-signup-phone"
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
            <label htmlFor="prov-signup-city">City</label>
            <input
              id="prov-signup-city"
              name="city"
              type="text"
              placeholder="e.g. Pune"
              value={form.city}
              onChange={handleChange}
              autoComplete="address-level2"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-signup-address">Pickup / Service Address</label>
            <textarea
              id="prov-signup-address"
              name="delivery_address"
              placeholder="Business address and nearby landmark"
              value={form.delivery_address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-signup-password">Password</label>
            <input
              id="prov-signup-password"
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
            <label htmlFor="prov-signup-confirm">Confirm Password</label>
            <input
              id="prov-signup-confirm"
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
            {isSubmitting ? "Creating account..." : "Create Provider Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProviderSignupModal;
