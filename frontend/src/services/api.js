import axios from 'axios';

// Use relative default so production bundles don't target localhost.
// In dev, Vite proxies /api to Django; in prod, it hits the same host.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/se';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django session auth
});

// Request interceptor for adding CSRF token
api.interceptors.request.use(async (config) => {
  let csrfToken = getCookie('csrftoken');
  
  // If no CSRF token exists (first request in production), fetch it
  if (!csrfToken && config.method !== 'get') {
    try {
      // Make a safe GET request to set the CSRF cookie
      await axios.get('/api/se/whoami/', { withCredentials: true });
      csrfToken = getCookie('csrftoken');
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }
  }
  
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Helper function to get cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default api;
