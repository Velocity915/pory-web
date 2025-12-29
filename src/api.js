const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Get stored token
const getToken = () => localStorage.getItem('token');

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  return response.json();
}

// Auth functions
export async function register(username, email, password) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!getToken();
}

export async function getCurrentUser() {
  return apiRequest('/me');
}

// Collection functions
export async function getCollection() {
  return apiRequest('/collection');
}

export async function addToCollection(dex_no, pokemon_name, is_shiny) {
  return apiRequest('/collection', {
    method: 'POST',
    body: JSON.stringify({ dex_no, pokemon_name, is_shiny }),
  });
}

export async function removeFromCollection(pokemonId) {
  return apiRequest(`/collection/${pokemonId}`, {
    method: 'DELETE',
  });
}

// Admin functions
export async function getAdminStats() {
  return apiRequest('/admin/stats');
}

export async function getAllUsers() {
  return apiRequest('/admin/users');
}

export async function deleteUser(userId) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}
