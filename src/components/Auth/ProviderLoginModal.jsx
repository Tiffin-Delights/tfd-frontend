import { useState } from "react";
import "./LoginModal.css";
import { loginUser } from "../../api/client";

function ProviderLoginModal({ onBack, onClose, onLoginSuccess, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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

          {error && <p className="modal-error">{error}</p>}

          <button type="submit" className="modal-submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In to Provider Dashboard"}
          </button>
        </form>

        <hr className="modal-divider" />
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
