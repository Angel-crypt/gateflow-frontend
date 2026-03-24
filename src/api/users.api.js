import apiClient from "./apiClient";

export const getUsers = () =>
  apiClient.get("/users/");

export const getUser = (id) =>
  apiClient.get(`/users/${id}/`);

export const createUser = (data) =>
  apiClient.post("/users/", data);
