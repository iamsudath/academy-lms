import axios from 'axios';

// Create a custom axios instance with dynamic base URL based on environment
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
});

// Helper to set/remove auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
