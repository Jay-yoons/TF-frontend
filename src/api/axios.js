import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: "https://talkingpotato.shop",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosInstance;