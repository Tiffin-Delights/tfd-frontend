const DEFAULT_API_BASE_URL = "/api/v1";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost";

function resolveApiAssetUrl(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value, API_ORIGIN).toString();
}

function normalizeProvider(provider) {
  if (!provider || typeof provider !== "object") {
    return provider;
  }

  return {
    ...provider,
    photo_urls: Array.isArray(provider.photo_urls)
      ? provider.photo_urls.map((photoUrl) => resolveApiAssetUrl(photoUrl))
      : provider.photo_urls,
  };
}

function normalizeProviderPhoto(photo) {
  if (!photo || typeof photo !== "object") {
    return photo;
  }

  return {
    ...photo,
    photo_url: resolveApiAssetUrl(photo.photo_url),
  };
}

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const detail = data?.detail || "Request failed";
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }

  return data;
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = {};
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function loginUser(email, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function requestPasswordResetOtp(payload) {
  return apiRequest("/auth/password-reset/request-otp", {
    method: "POST",
    body: payload,
  });
}

export async function confirmPasswordResetOtp(payload) {
  return apiRequest("/auth/password-reset/confirm", {
    method: "POST",
    body: payload,
  });
}

export async function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function getProfile(token) {
  return apiRequest("/users/profile", { token });
}

export async function updateUserLocation(token, payload) {
  return apiRequest("/users/profile/location", {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function listProviders(token, city, dietMode, customerLocation) {
  const params = new URLSearchParams();

  if (city) {
    params.set("city", city);
  }

  if (dietMode === "veg" || dietMode === "nonveg") {
    params.set("diet_mode", dietMode);
  }

  if (customerLocation?.latitude != null && customerLocation?.longitude != null) {
    params.set("customer_latitude", customerLocation.latitude);
    params.set("customer_longitude", customerLocation.longitude);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/providers${query}`, { token });
  return Array.isArray(data) ? data.map(normalizeProvider) : [];
}

export async function getProviderMenu(token, providerId) {
  return apiRequest(`/menu/provider/${providerId}`, { token });
}

export async function getProviderOrders(token, providerId) {
  const query = providerId ? `?provider_id=${providerId}` : "";
  return apiRequest(`/orders/provider${query}`, { token });
}

export async function getProviderSubscriptions(token, providerId) {
  const query = providerId ? `?provider_id=${providerId}` : "";
  return apiRequest(`/subscriptions/provider${query}`, { token });
}

export async function getProviderFeedback(token, providerId) {
  const query = providerId ? `?provider_id=${providerId}` : "";
  return apiRequest(`/feedback/provider${query}`, { token });
}

export async function getMySubscriptions(token) {
  return apiRequest("/subscriptions/me", { token });
}

export async function getMySubscriptionMeals(token, subscriptionId) {
  const query = subscriptionId ? `?subscription_id=${subscriptionId}` : "";
  return apiRequest(`/subscriptions/meals/me${query}`, { token });
}

export async function createSubscription(token, payload) {
  return apiRequest("/subscriptions/manage", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function createSubscriptionCheckout(token, payload) {
  return apiRequest("/subscriptions/checkout", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function cancelSubscriptionMeals(token, payload) {
  return apiRequest("/subscriptions/meals/cancel", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function createOrder(token, payload) {
  return apiRequest("/orders/create", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function submitFeedback(token, payload) {
  return apiRequest("/feedback/submit", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getWallet(token) {
  return apiRequest("/users/wallet", { token });
}

export async function changePassword(token, payload) {
  return apiRequest("/users/password", {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function uploadMenuDish(token, payload) {
  return apiRequest("/menu/upload", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getMyMenu(token) {
  return apiRequest("/menu/me", {
    token,
  });
}

export async function updateMenuDish(token, dishId, payload) {
  return apiRequest(`/menu/${dishId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteMenuDish(token, dishId) {
  return apiRequest(`/menu/${dishId}`, {
    method: "DELETE",
    token,
  });
}

export async function getProviderPricing(providerId, token) {
  return apiRequest(`/providers/${providerId}/pricing`, { token });
}

export async function updateProviderLocation(token, payload) {
  return apiRequest("/providers/profile/location", {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function createPayment(token, payload) {
  return apiRequest("/payments/create", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function verifyPayment(token, payload) {
  return apiRequest("/payments/verify", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getProviderPhotos(token) {
  const data = await apiRequest("/providers/photos", { token });
  return Array.isArray(data) ? data.map(normalizeProviderPhoto) : [];
}

export async function uploadProviderPhotos(token, files) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  const data = await apiRequest("/providers/photos", {
    method: "POST",
    token,
    body: formData,
  });
  return Array.isArray(data) ? data.map(normalizeProviderPhoto) : [];
}

export async function deleteProviderPhoto(token, photoId) {
  return apiRequest(`/providers/photos/${photoId}`, {
    method: "DELETE",
    token,
  });
}
