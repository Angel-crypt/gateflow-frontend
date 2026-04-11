import apiClient from "./apiClient";

export const getHealthCheck = () =>
  apiClient.get("/api/health/");

export const getDashboard = () =>
  apiClient.get("/api/metrics/dashboard/");

export const getAccessLogMetrics = (period = "week") =>
  apiClient.get(`/api/metrics/access-logs/?period=${period}`);

export const getPassMetrics = () =>
  apiClient.get("/api/metrics/passes/");

export const getAccessTable = (params = {}) =>
  apiClient.get("/api/metrics/access-table/", { params });

export const exportAccessTableCSV = (params = {}) =>
  apiClient.get("/api/access-logs/export/", { params, responseType: "blob" });

export const exportAccessTablePDF = (params = {}) =>
  apiClient.get("/api/access-logs/export/pdf/", { params, responseType: "blob" });
