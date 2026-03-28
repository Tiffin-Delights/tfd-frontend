import { useId, useState } from "react";
import "./StarRating.css";

function clampRating(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(5, number));
}

function formatRating(value) {
  const normalized = clampRating(value);
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(1);
}

function StarRating({
  value = 0,
  onChange,
  editable = false,
  size = "md",
  className = "",
  showValue = false,
  emptyLabel = "No ratings yet",
}) {
  const [hoverValue, setHoverValue] = useState(null);
  const inputName = useId();
  const currentValue = clampRating(value);
  const displayValue = editable && hoverValue != null ? hoverValue : currentValue;
  const fillWidth = `${(displayValue / 5) * 100}%`;
  const rootClassName = ["star-rating", `star-rating--${size}`, editable ? "is-editable" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div
        className="star-rating__visual"
        role={editable ? "radiogroup" : "img"}
        aria-label={currentValue > 0 ? `${formatRating(currentValue)} out of 5 stars` : emptyLabel}
        onMouseLeave={editable ? () => setHoverValue(null) : undefined}
      >
        <span className="star-rating__base" aria-hidden="true">★★★★★</span>
        <span className="star-rating__fill" aria-hidden="true" style={{ width: fillWidth }}>
          ★★★★★
        </span>
        {editable && (
          <div className="star-rating__inputs">
            {Array.from({ length: 10 }, (_, index) => {
              const ratingValue = (index + 1) / 2;
              return (
                <button
                  key={ratingValue}
                  type="button"
                  name={inputName}
                  className="star-rating__hit"
                  aria-label={`Rate ${formatRating(ratingValue)} stars`}
                  aria-pressed={currentValue === ratingValue}
                  onMouseEnter={() => setHoverValue(ratingValue)}
                  onFocus={() => setHoverValue(ratingValue)}
                  onBlur={() => setHoverValue(null)}
                  onClick={() => onChange?.(ratingValue)}
                />
              );
            })}
          </div>
        )}
      </div>
      {showValue && (
        <span className="star-rating__value">
          {currentValue > 0 ? formatRating(currentValue) : emptyLabel}
        </span>
      )}
    </div>
  );
}

export default StarRating;
