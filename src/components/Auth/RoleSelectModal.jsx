import "./LoginModal.css";

function RoleSelectModal({ onSelect, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-accent" />
        <h2 className="modal-title">Welcome Back!</h2>
        <p className="modal-subtitle">Who are you logging in as?</p>

        <div className="role-options">
          <button
            className="role-card"
            onClick={() => onSelect("customer")}
          >
            <span className="role-card__icon">🍱</span>
            <span className="role-card__label">Customer</span>
            <span className="role-card__sub">
              Order & manage your tiffin
            </span>
          </button>

          <button
            className="role-card"
            onClick={() => onSelect("provider")}
          >
            <span className="role-card__icon">🏪</span>
            <span className="role-card__label">Provider</span>
            <span className="role-card__sub">
              Tiffin service business
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleSelectModal;
