import apiClient from "./apiClient";

export const login = (credentials) =>
  apiClient.post("/api/auth/login/", credentials);

export const logout = (refreshToken) =>
  apiClient.post("/api/auth/logout/", { refresh: refreshToken });

export const getMe = () => apiClient.get("/api/auth/me/");

export const changePassword = (data) =>
  apiClient.post("/api/auth/change-password/", data);
