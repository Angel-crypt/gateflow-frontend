import apiClient from "./apiClient";

export const getAccessLogs = () =>
  apiClient.get("/access/");

export const getAccessLog = (id) =>
  apiClient.get(`/access/${id}/`);

export const createAccessLog = (data) =>
  apiClient.post("/access/create/", data);
