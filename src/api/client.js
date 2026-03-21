const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

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
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

export async function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function getProfile(token) {
  return apiRequest("/users/profile", { token });
}

export async function listProviders(token, city) {
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  return apiRequest(`/providers${query}`, { token });
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

export async function createSubscription(token, payload) {
  return apiRequest("/subscriptions/manage", {
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
