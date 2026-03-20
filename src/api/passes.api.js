import apiClient from "./apiClient";

export const getPasses = () =>
  apiClient.get("/passes/");

export const getPass = (id) =>
  apiClient.get(`/passes/${id}/`);

export const createPass = (data) =>
  apiClient.post("/passes/", data);

export const updatePass = (id, data) =>
  apiClient.patch(`/passes/${id}/`, data);

export const deletePass = (id) =>
  apiClient.delete(`/passes/${id}/`);

export const validatePass = (qrCode) =>
  apiClient.post("/passes/validate/", { qr_code: qrCode });
