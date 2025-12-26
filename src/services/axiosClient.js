import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Supabase Token
apiClient.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle Global Errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ignore request cancellations
        if (axios.isCancel(error)) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            // Token expired or invalid
            console.warn('Unauthorized access. Redirecting to login...');
            localStorage.removeItem('token'); // Clear token
            window.location.href = '/login';
        } else if (error.response?.status >= 500) {
            // Server error
            console.error('Server error:', error.response.data);
            alert('A server error occurred. Please try again later.');
        } else if (!error.response) {
            // Network error
            console.error('Network error:', error);
            alert('Unable to connect to the server. Please check your internet connection.');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
