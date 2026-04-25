const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return String(value ?? "").trim().length === 0;
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value ?? "").trim());
}

function isValidPhone(value) {
  return /^\d{10}$/.test(String(value ?? "").trim());
}

function validatePassword(password, label = "Password") {
  const normalized = String(password ?? "").trim();

  if (!normalized) {
    return `${label} is required.`;
  }

  if (normalized.length < 6) {
    return `${label} must be at least 6 characters.`;
  }

  if (!/[A-Za-z]/.test(normalized)) {
    return `${label} must include at least one letter.`;
  }

  if (!/\d/.test(normalized)) {
    return `${label} must include at least one number.`;
  }

  return "";
}

export function validateLoginForm(form) {
  if (isBlank(form.email)) {
    return "Email is required.";
  }

  if (!isValidEmail(form.email)) {
    return "Please enter a valid email address.";
  }

  return validatePassword(form.password);
}

export function validateCustomerSignupForm(form) {
  if (isBlank(form.name)) {
    return "Full name is required.";
  }

  if (String(form.name).trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }

  if (isBlank(form.email)) {
    return "Email is required.";
  }

  if (!isValidEmail(form.email)) {
    return "Please enter a valid email address.";
  }

  if (isBlank(form.phone)) {
    return "Phone number is required.";
  }

  if (!isValidPhone(form.phone)) {
    return "Phone number must be exactly 10 digits.";
  }

  const passwordError = validatePassword(form.password);
  if (passwordError) {
    return passwordError;
  }

  if (String(form.password ?? "") !== String(form.confirmPassword ?? "")) {
    return "Passwords do not match.";
  }

  return "";
}

export function validateProviderSignupForm(form) {
  if (isBlank(form.name)) {
    return "Owner name is required.";
  }

  if (String(form.name).trim().length < 2) {
    return "Owner name must be at least 2 characters.";
  }

  if (isBlank(form.mess_name)) {
    return "Mess/Restaurant name is required.";
  }

  if (String(form.mess_name).trim().length < 2) {
    return "Mess/Restaurant name must be at least 2 characters.";
  }

  if (![
    "pure_veg",
    "mixed",
  ].includes(String(form.providerFoodCategory || "").trim())) {
    return "Please select your food category (Pure Veg or Mixed).";
  }

  if (isBlank(form.email)) {
    return "Email is required.";
  }

  if (!isValidEmail(form.email)) {
    return "Please enter a valid email address.";
  }

  if (isBlank(form.phone)) {
    return "Phone number is required.";
  }

  if (!isValidPhone(form.phone)) {
    return "Phone number must be exactly 10 digits.";
  }

  if (isBlank(form.city)) {
    return "City is required.";
  }

  if (isBlank(form.serviceAddressText) || !form.servicePlaceId) {
    return "Please choose the provider service address from the location suggestions.";
  }

  if (form.serviceLatitude == null || form.serviceLongitude == null) {
    return "Provider coordinates are missing. Please choose the service address again.";
  }

  const radius = Number(form.serviceRadiusKm);
  if (!Number.isFinite(radius) || radius <= 0) {
    return "Please enter a valid delivery radius in kilometers.";
  }

  const passwordError = validatePassword(form.password);
  if (passwordError) {
    return passwordError;
  }

  if (String(form.password ?? "") !== String(form.confirmPassword ?? "")) {
    return "Passwords do not match.";
  }

  return "";
}
