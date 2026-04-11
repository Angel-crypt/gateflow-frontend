import apiClient from "./apiClient";

export const getAccessLogs = () =>
  apiClient.get("/api/access-logs/");

export const getAccessLog = (id) =>
  apiClient.get(`/api/access-logs/${id}/`);

export const createAccessLog = (data) =>
  apiClient.post("/api/access-logs/create/", data);

export const registerExit = (id) =>
  apiClient.post(`/api/access-logs/${id}/register-exit/`);

export const exportAccessLogsCSV = (params = {}) =>
  apiClient.get("/api/access-logs/export/", { params, responseType: "blob" });

export const exportAccessLogsPDF = (params = {}) =>
  apiClient.get("/api/access-logs/export/pdf/", { params, responseType: "blob" });
