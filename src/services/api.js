import axios from 'axios';

const api = axios.create({
    baseURL: 'https://bug-tracker-backend-eight.vercel.app/api',
});

// ✅ ADD THIS INTERCEPTOR
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
