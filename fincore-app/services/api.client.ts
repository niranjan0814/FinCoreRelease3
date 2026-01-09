
import { API_BASE_URL, getHeaders } from './api.config';

// Create a custom fetch wrapper
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    // Merge headers
    const headers = {
        ...getHeaders(),
        ...(options.headers || {})
    };

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers
        });

        // Check for 401 Unauthorized
        if (response.status === 401) {
            // Clear storage and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        return response;
    } catch (error) {
        throw error;
    }
};
