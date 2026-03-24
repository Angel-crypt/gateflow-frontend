import apiClient from "./apiClient";

export const getDestinations = () =>
  apiClient.get("/destinations/");

export const getDestination = (id) =>
  apiClient.get(`/destinations/${id}/`);

export const createDestination = (data) =>
  apiClient.post("/destinations/", data);

export const updateDestination = (id, data) =>
  apiClient.patch(`/destinations/${id}/`, data);

export const deleteDestination = (id) =>
  apiClient.delete(`/destinations/${id}/`);

export const toggleActiveDestination = (id, isActive) =>
  apiClient.patch(`/destinations/${id}/`, { is_active: isActive });
