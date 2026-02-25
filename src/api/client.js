import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach Bearer token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear storage and redirect to /login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeWorkspace');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
export { BASE_URL };
