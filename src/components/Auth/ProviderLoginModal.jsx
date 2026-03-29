import { useState } from "react";
import "./LoginModal.css";
import { loginUser } from "../../api/client";
import { validateLoginForm } from "./authValidation";
import PasswordField from "./PasswordField";

function ProviderLoginModal({ onBack, onClose, onLoginSuccess, onSwitchToSignup, onForgotPassword }) {
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
      if (result?.user?.role !== "provider" && result?.user?.role !== "admin") {
        setError("This account is not a provider/admin account.");
        return;
      }

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
        <h2 className="modal-title">Provider Login</h2>
        <p className="modal-subtitle">
          Access your tiffin service dashboard
        </p>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
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

          <PasswordField
            id="prov-password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            minLength={6}
            hint="Password must be at least 6 characters."
            required
          />

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In to Provider Dashboard"}
          </button>
        </form>

        <hr className="modal-divider" />
        <p className="modal-footnote">
          Forgot your password?{" "}
          <button type="button" className="modal-link" onClick={onForgotPassword}>
            Reset it
          </button>
        </p>
        <p className="modal-footnote">
          New provider?{" "}
          <button type="button" className="modal-link" onClick={onSwitchToSignup}>
            Create provider account
          </button>
        </p>
      </div>
    </div>
  );
}

export default ProviderLoginModal;
