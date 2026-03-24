import apiClient from "./apiClient";

export const getUsers = () =>
  apiClient.get("/users/");

export const getUser = (id) =>
  apiClient.get(`/users/${id}/`);

export const createUser = (data) =>
  apiClient.post("/users/", data);

export const updateUser = (id, data) =>
  apiClient.patch(`/users/${id}/`, data);

export const deleteUser = (id) =>
  apiClient.delete(`/users/${id}/`);

export const toggleActiveUser = (id, isActive) =>
  apiClient.patch(`/users/${id}/`, { is_active: isActive });
