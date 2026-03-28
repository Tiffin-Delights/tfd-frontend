import { useState } from "react";
import "./LoginModal.css";
import { loginUser, registerUser } from "../../api/client";
import { validateProviderSignupForm } from "./authValidation";
import LocationPicker from "../Location/LocationPicker";
import PasswordField from "./PasswordField";

function ProviderSignupModal({ onBack, onClose, onSignupSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    mess_name: "",
    city: "",
    delivery_address: "",
    serviceAddressText: "",
    servicePlaceId: "",
    serviceLatitude: null,
    serviceLongitude: null,
    serviceRadiusKm: "5",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    if (error) {
      setError("");
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLocationSelect = (location) => {
    if (error) {
      setError("");
    }

    setForm((prev) => ({
      ...prev,
      delivery_address: location.label,
      serviceAddressText: location.label,
      servicePlaceId: location.placeId,
      serviceLatitude: location.latitude,
      serviceLongitude: location.longitude,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateProviderSignupForm(form);
    if (validationError) {
      setError(validationError);
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
        service_address_text: form.serviceAddressText.trim(),
        service_place_id: form.servicePlaceId,
        service_latitude: form.serviceLatitude,
        service_longitude: form.serviceLongitude,
        service_radius_km: Number(form.serviceRadiusKm),
      });

      const loginResult = await loginUser(form.email.trim(), form.password);
      if (loginResult?.user?.role !== "provider" && loginResult?.user?.role !== "admin") {
        setError("Provider signup completed, but the returned account is not a provider account.");
        return;
      }
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
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />
            <p className="form-hint">Use a valid 10-digit phone number.</p>
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
            <LocationPicker
              label="Pickup / Service Address"
              placeholder="Search your kitchen or business address"
              value={{
                label: form.serviceAddressText,
                latitude: form.serviceLatitude,
                longitude: form.serviceLongitude,
                placeId: form.servicePlaceId,
              }}
              onSelect={handleLocationSelect}
              onError={setError}
              helperText="Choose a suggested place so we can save exact delivery coordinates."
            />
          </div>

          <div className="form-group">
            <label htmlFor="prov-signup-radius">Delivery Radius (km)</label>
            <input
              id="prov-signup-radius"
              name="serviceRadiusKm"
              type="number"
              min="1"
              max="100"
              step="0.5"
              placeholder="e.g. 5"
              value={form.serviceRadiusKm}
              onChange={handleChange}
              required
            />
            <p className="form-hint">Customers inside this radius will see your service.</p>
          </div>

          <PasswordField
            id="prov-signup-password"
            name="password"
            label="Password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            hint="At least 6 characters with letters and numbers."
            required
          />

          <PasswordField
            id="prov-signup-confirm"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={6}
            required
          />

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
