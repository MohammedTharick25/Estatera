import axios from "axios";
const endpoint = `${import.meta.env.VITE_API_URL}/api/listings`;
export const getProperties = (params = "") => axios.get(params ? `${endpoint}?${params}` : endpoint);
export const getProperty = (id) => axios.get(`${endpoint}/${id}`);
export const incrementPropertyView = (id) => axios.patch(`${endpoint}/${id}/view`);
