import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/appweb/backend/api"
});

export default api;