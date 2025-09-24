import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || `http://localhost:9000/api`,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     if (err.response?.status === 401) {
//       // TODO: optional refresh token flow
//       localStorage.removeItem("access_token");
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   }
// );

export default api;
