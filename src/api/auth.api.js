import apiClient from "./apiClient";

export const login = (credentials) =>
  apiClient.post("/auth/login/", credentials);

export const logout = (refreshToken) =>
  apiClient.post("/auth/logout/", { refresh: refreshToken });

export const getMe = () => apiClient.get("/auth/me/");

export const changePassword = (data) =>
  apiClient.post("/auth/change-password/", data);
