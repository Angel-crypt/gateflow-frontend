import apiClient from "./apiClient";

export const getPasses = () =>
  apiClient.get("/api/passes/");

export const getPass = (id) =>
  apiClient.get(`/api/passes/${id}/`);

export const createPass = (data) =>
  apiClient.post("/api/passes/", data);

export const updatePass = (id, data) =>
  apiClient.patch(`/api/passes/${id}/`, data);

export const deletePass = (id) =>
  apiClient.delete(`/api/passes/${id}/`);

export const validatePass = (passId) =>
  apiClient.post("/api/passes/validate/", { pass_id: Number(passId) });
