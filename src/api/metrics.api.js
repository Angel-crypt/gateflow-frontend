import apiClient from "./apiClient";

export const getDashboard = () =>
  apiClient.get("/api/metrics/dashboard/");

export const getAccessLogMetrics = (period = "week") =>
  apiClient.get(`/api/metrics/access-logs/?period=${period}`);

export const getPassMetrics = () =>
  apiClient.get("/api/metrics/passes/");
