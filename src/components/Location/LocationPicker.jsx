import { useEffect, useId, useRef, useState } from "react";
import { reverseGeocodeLocation, searchLocations } from "../../utils/locationIq";
import "./LocationPicker.css";

function LocationPicker({
  label = "Location",
  placeholder = "Search for your address",
  value,
  onSelect,
  onError,
  disabled = false,
  allowCurrentLocation = false,
  currentLocationLabel = "Use My Location",
  helperText = "",
}) {
  const inputId = useId();
  const debounceRef = useRef(null);
  const [query, setQuery] = useState(() => value?.label || "");
  const [status, setStatus] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handlePredictionPick = (prediction) => {
    setQuery(prediction.label);
    setSuggestions([]);
    setStatus("Location selected.");
    onSelect?.(prediction);
  };

  const handleQueryChange = (event) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    setStatus("");
    setSuggestions([]);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!nextValue.trim()) {
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      setIsLoading(true);
      searchLocations(nextValue)
        .then((predictions) => {
          setIsLoading(false);
          setSuggestions(predictions);
        })
        .catch((error) => {
          setIsLoading(false);
          setSuggestions([]);
          onError?.(error.message || "Unable to fetch location suggestions.");
        });
    }, 250);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      onError?.("Browser geolocation is not supported on this device.");
      return;
    }

    setIsLoading(true);
    setStatus("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude);
        const longitude = Number(coords.longitude);

        reverseGeocodeLocation(latitude, longitude)
          .then((nextLocation) => {
            setIsLoading(false);
            setQuery(nextLocation.label);
            setSuggestions([]);
            setStatus("Current location selected.");
            onSelect?.(nextLocation);
          })
          .catch((error) => {
            setIsLoading(false);
            setStatus("");
            onError?.(error.message || "We found your coordinates but could not read the address.");
          });
      },
      (error) => {
        setIsLoading(false);
        setStatus("");
        if (error.code === error.PERMISSION_DENIED) {
          onError?.("Location permission was denied. Please search manually.");
          return;
        }
        onError?.("Unable to fetch your current location right now.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  return (
    <div className="location-picker">
      <label htmlFor={inputId}>{label}</label>
      {allowCurrentLocation && (
        <button
          type="button"
          className="location-picker__action"
          onClick={handleUseCurrentLocation}
          disabled={disabled || isLoading}
        >
          {currentLocationLabel}
        </button>
      )}
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
      />
      {helperText && <p className="location-picker__hint">{helperText}</p>}
      {status && <p className="location-picker__status">{status}</p>}
      {suggestions.length > 0 && (
        <div className="location-picker__results" role="listbox" aria-label={`${label} suggestions`}>
          {suggestions.map((prediction) => (
            <button
              key={`${prediction.placeId}-${prediction.latitude}-${prediction.longitude}`}
              type="button"
              className="location-picker__result"
              onClick={() => handlePredictionPick(prediction)}
            >
              {prediction.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
