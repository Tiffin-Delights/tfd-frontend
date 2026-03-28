import { useEffect, useRef, useState } from "react";

function PasswordField({ label, hint, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isVisible) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return undefined;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      timeoutRef.current = null;
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVisible]);

  return (
    <div className="form-group">
      <label htmlFor={inputProps.id}>{label}</label>
      <div className="password-field">
        <input
          {...inputProps}
          type={isVisible ? "text" : "password"}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setIsVisible(true)}
          aria-label={`${isVisible ? "Hide" : "Show"} password`}
          aria-pressed={isVisible}
        >
          <span aria-hidden="true">👁</span>
        </button>
      </div>
      {hint ? <p className="form-hint">{hint}</p> : null}
    </div>
  );
}

export default PasswordField;
