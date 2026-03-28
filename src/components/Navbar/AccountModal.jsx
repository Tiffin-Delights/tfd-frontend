import { useState } from "react";
import { changePassword } from "../../api/client";
import "../Auth/LoginModal.css";

function AccountModal({ auth, isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await changePassword(auth?.token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(response?.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError?.message || "Could not change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--large" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">x</button>
        <div className="modal-accent" />
        <h2 className="modal-title">Account Settings</h2>
        <p className="modal-subtitle">Manage password and account access</p>

        <form className="modal-form" onSubmit={handlePasswordUpdate} noValidate>
          <div className="form-group">
            <label htmlFor="account-current-password">Current Password</label>
            <input
              id="account-current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="account-new-password">New Password</label>
            <input
              id="account-new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="account-confirm-password">Confirm New Password</label>
            <input
              id="account-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="modal-submit" disabled={submitting}>
            {submitting ? "Saving..." : "Update Password"}
          </button>
        </form>

        {error && <p className="modal-error">{error}</p>}
        {success && <p className="modal-success">{success}</p>}
      </div>
    </div>
  );
}

export default AccountModal;
