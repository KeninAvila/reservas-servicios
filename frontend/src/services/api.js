import axios from "axios";

const api = axios.create({
  baseURL: "/appweb/backend/api"
});

export default api;