import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";

axios.interceptors.request.use((config) => {
  const apiUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  const requestUrl = String(config.url || "");
  if (apiUrl && requestUrl.startsWith(apiUrl)) config.url = `${apiUrl}${requestUrl.slice(apiUrl.length).replace(/^\/+/, "/")}`;
  const normalizedUrl = String(config.url || "");
  const isEstateraApi = normalizedUrl.startsWith("/api/") || (apiUrl && normalizedUrl.startsWith(apiUrl));
  if (!isEstateraApi) return config;
  try { const saved = JSON.parse(localStorage.getItem("userInfo")); if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`; } catch (_) { /* Requests without a session stay public. */ }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
