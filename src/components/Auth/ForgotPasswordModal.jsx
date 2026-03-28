import { useState } from "react";
import { confirmPasswordResetOtp, requestPasswordResetOtp } from "../../api/client";
import PasswordField from "./PasswordField";
import "./LoginModal.css";

function ForgotPasswordModal({ onBack, onClose }) {
  const [step, setStep] = useState(1);
  const [channel, setChannel] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [isResetComplete, setIsResetComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const identifierLabel = channel === "email" ? "Email Address" : "Phone Number";

  const handleRequestToken = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (channel === "email" && !email.trim()) {
      setError("Email is required.");
      return;
    }

    if (channel === "phone" && !phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await requestPasswordResetOtp({
        channel,
        email: channel === "email" ? email.trim() : undefined,
        phone: channel === "phone" ? phone.trim() : undefined,
      });
      setMessage(response?.message || "OTP sent successfully.");
      setChallengeId(response?.challenge_id || "");
      setEmailHint(response?.account_email_hint || "");
      setLoginEmail(response?.account_login_email || "");
      setIsResetComplete(false);
      setStep(2);
    } catch (requestError) {
      setError(requestError?.message || "Failed to start password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!challengeId.trim()) {
      setError("Password reset challenge is missing. Request OTP again.");
      return;
    }

    if (!otp.trim()) {
      setError("OTP is required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await confirmPasswordResetOtp({
        challenge_id: challengeId.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setMessage(response?.message || "Password reset successful. Please login with your new password.");
      setLoginEmail(response?.login_email || loginEmail);
      setIsResetComplete(true);
      setTimeout(() => {
        onBack?.();
      }, 1200);
    } catch (resetError) {
      setError(resetError?.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          x
        </button>

        <button className="modal-back" onClick={onBack}>
          {"<- Back"}
        </button>

        <div className="modal-accent" />
        <h2 className="modal-title">Reset Password</h2>
        <p className="modal-subtitle">
          {step === 1
            ? "Choose OTP channel and request verification code"
            : "Enter OTP and set a new password"}
        </p>

        {step === 1 ? (
          <form className="modal-form" onSubmit={handleRequestToken} noValidate>
            <div className="form-group">
              <label htmlFor="reset-channel">OTP Channel</label>
              <select
                id="reset-channel"
                value={channel}
                onChange={(event) => {
                  const nextChannel = event.target.value;
                  setChannel(nextChannel);
                  if (nextChannel === "phone" && !phone) {
                    setPhone("+91");
                  }
                }}
              >
                <option value="email">Email OTP</option>
                <option value="phone">Phone OTP</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reset-identifier">{identifierLabel}</label>
              <input
                id="reset-identifier"
                type={channel === "email" ? "email" : "tel"}
                value={channel === "email" ? email : phone}
                onChange={(event) => {
                  if (channel === "email") {
                    setEmail(event.target.value);
                  } else {
                    setPhone(event.target.value);
                  }
                }}
                placeholder={channel === "email" ? "you@example.com" : "+919876543210"}
                autoComplete={channel === "email" ? "email" : "tel"}
                required
              />
            </div>

            {error && <p className="modal-error">{error}</p>}
            {message && <p className="modal-success">{message}</p>}

            <button type="submit" className="modal-submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="modal-form" onSubmit={handleResetPassword} noValidate>
            {loginEmail ? (
              <p className="form-hint">Login email: {loginEmail}</p>
            ) : emailHint ? (
              <p className="form-hint">Account email for login: {emailHint}</p>
            ) : null}
            <div className="form-group">
              <label htmlFor="reset-otp">OTP</label>
              <input
                id="reset-otp"
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter OTP"
                autoComplete="off"
                required
              />
            </div>

            <PasswordField
              id="reset-new-password"
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <PasswordField
              id="reset-confirm-password"
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />

            {error && <p className="modal-error">{error}</p>}
            {message && <p className="modal-success">{message}</p>}
            {isResetComplete && loginEmail && <p className="form-hint">Log in with email: {loginEmail}</p>}

            {isResetComplete ? (
              <button type="button" className="modal-submit" onClick={onBack}>
                Go to Login
              </button>
            ) : (
              <button type="submit" className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
