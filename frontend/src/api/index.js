import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mocking JWT interceptors for this challenge
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap success envelope
api.interceptors.response.use(
  (response) => {
    // If the backend wraps data in { success: true, data: ... }
    if (response.data && response.data.success !== undefined && response.data.data) {
       return response.data.data;
    }
    // Handle paginated responses
    if (response.data && response.data.results) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error.response?.data?.error || error.message);
  }
);

export default api;
