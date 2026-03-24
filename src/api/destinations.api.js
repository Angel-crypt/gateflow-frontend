import apiClient from "./apiClient";

export const getDestinations = () =>
  apiClient.get("/destinations/");

export const getDestination = (id) =>
  apiClient.get(`/destinations/${id}/`);

export const createDestination = (data) =>
  apiClient.post("/destinations/", data);
