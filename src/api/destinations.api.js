import apiClient from "./apiClient";

export const getDestinations = () =>
  apiClient.get("/api/destinations/");

export const getDestination = (id) =>
  apiClient.get(`/api/destinations/${id}/`);

export const createDestination = (data) =>
  apiClient.post("/api/destinations/", data);

export const updateDestination = (id, data) =>
  apiClient.patch(`/api/destinations/${id}/`, data);

export const deleteDestination = (id) =>
  apiClient.delete(`/api/destinations/${id}/`);

export const toggleActiveDestination = (id, isActive) =>
  apiClient.patch(`/api/destinations/${id}/`, { is_active: isActive });
