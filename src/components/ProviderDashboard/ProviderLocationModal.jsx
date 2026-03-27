import { useEffect, useState } from "react";
import { updateProviderLocation } from "../../api/client";
import LocationPicker from "../Location/LocationPicker";
import "./ModalsCommon.css";
import "./ProviderLocationModal.css";

function ProviderLocationModal({ auth, profileData, isOpen, onClose, onUpdateSuccess }) {
  const [form, setForm] = useState({
    city: "",
    serviceAddressText: "",
    servicePlaceId: "",
    serviceLatitude: null,
    serviceLongitude: null,
    serviceRadiusKm: "5",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !profileData) {
      return;
    }

    setForm({
      city: profileData.city || "",
      serviceAddressText: profileData.service_address_text || "",
      servicePlaceId: profileData.service_place_id || "",
      serviceLatitude: profileData.service_latitude != null ? Number(profileData.service_latitude) : null,
      serviceLongitude: profileData.service_longitude != null ? Number(profileData.service_longitude) : null,
      serviceRadiusKm: profileData.service_radius_km != null ? String(profileData.service_radius_km) : "5",
    });
    setError("");
    setSuccess("");
  }, [isOpen, profileData]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.city.trim()) {
      setError("City is required.");
      return;
    }

    if (!form.serviceAddressText.trim() || !form.servicePlaceId) {
      setError("Choose a suggested service address so coordinates can be saved.");
      return;
    }

    if (form.serviceLatitude == null || form.serviceLongitude == null) {
      setError("Location coordinates are missing. Please choose the address again.");
      return;
    }

    const radius = Number(form.serviceRadiusKm);
    if (!Number.isFinite(radius) || radius <= 0) {
      setError("Enter a valid delivery radius in kilometers.");
      return;
    }

    try {
      setSubmitting(true);
      const updatedProvider = await updateProviderLocation(auth?.token, {
        city: form.city.trim(),
        service_address_text: form.serviceAddressText.trim(),
        service_place_id: form.servicePlaceId,
        service_latitude: form.serviceLatitude,
        service_longitude: form.serviceLongitude,
        service_radius_km: radius,
      });
      setSuccess("Delivery coverage updated.");
      onUpdateSuccess?.(updatedProvider);
    } catch (updateError) {
      setError(updateError?.message || "Could not update delivery coverage.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content provider-location-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Delivery Coverage</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="provider-location-form">
          <div className="form-group">
            <label htmlFor="provider-city">City</label>
            <input
              id="provider-city"
              name="city"
              type="text"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="e.g. Indore"
              required
            />
          </div>

          <div className="form-group">
            <LocationPicker
              label="Service Address"
              placeholder="Search your delivery origin or kitchen address"
              value={{
                label: form.serviceAddressText,
                latitude: form.serviceLatitude,
                longitude: form.serviceLongitude,
                placeId: form.servicePlaceId,
              }}
              onSelect={(location) => {
                setError("");
                setForm((prev) => ({
                  ...prev,
                  serviceAddressText: location.label,
                  servicePlaceId: location.placeId,
                  serviceLatitude: location.latitude,
                  serviceLongitude: location.longitude,
                }));
              }}
              onError={setError}
              helperText="Choose a suggested place so customer matching uses exact coordinates."
            />
          </div>

          <div className="form-group">
            <label htmlFor="provider-radius">Delivery Radius (km)</label>
            <input
              id="provider-radius"
              name="serviceRadiusKm"
              type="number"
              value={form.serviceRadiusKm}
              onChange={(event) => setForm((prev) => ({ ...prev, serviceRadiusKm: event.target.value }))}
              min="1"
              max="100"
              step="0.5"
              required
            />
          </div>

          <div className="provider-location-modal__actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Coverage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProviderLocationModal;
