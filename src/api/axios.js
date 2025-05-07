import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Change if your Laravel runs on a different port
});

export default api;
