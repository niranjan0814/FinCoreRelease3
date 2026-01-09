export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const getHeaders = () => {
    // Always get the latest token from storage
    // Sanitize token to avoid "The string did not match the expected pattern" error
    const token = typeof window !== 'undefined' ? localStorage.getItem('token')?.trim().replace(/[\n\r]/g, '') : null;
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};
