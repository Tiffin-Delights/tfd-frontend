import { useState } from "react";
import "./LoginModal.css";
import { loginUser } from "../../api/client";
import { validateLoginForm } from "./authValidation";

function CustomerLoginModal({ onBack, onClose, onLoginSuccess, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    if (error) {
      setError("");
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateLoginForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser(form.email, form.password);
      if (onLoginSuccess) {
        onLoginSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
              minLength={6}
              required
            />
            <p className="form-hint">Password must be at least 6 characters.</p>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In to My Account"}
          </button>
        </form>

        <hr className="modal-divider" />
        <p className="modal-footnote">
          New here?{" "}
          <button type="button" className="modal-link" onClick={onSwitchToSignup}>
            Create customer account
          </button>
        </p>
      </div>
    </div>
  );
}

export default CustomerLoginModal;
