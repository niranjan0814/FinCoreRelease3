import { Center, CenterFormData, ApiResponse } from '../types/center.types';
import { API_BASE_URL, getHeaders } from './api.config';

const fetchOptions = {
    credentials: 'include' as RequestCredentials,
};

async function handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        if (data && (response.status === 422 || response.status === 409)) {
            const error = new Error(data.message || 'Validation failed');
            (error as any).errors = data.errors;
            throw error;
        }

        const errorMessage = (data && data.message) || response.statusText;
        throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }

    return (data as ApiResponse<T>).data;
}

export const centerService = {
    // Get all centers
    getCenters: async (): Promise<Center[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/centers`, {
                ...fetchOptions,
                headers: getHeaders()
            });
            return handleResponse<Center[]>(response);
        } catch (error) {
            console.error('Error fetching centers:', error);
            return [];
        }
    },

    // Get single center
    getCenterById: async (id: string): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            ...fetchOptions,
            headers: getHeaders()
        });
        return handleResponse<Center>(response);
    },

    // Create new center
    createCenter: async (data: CenterFormData): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Center>(response);
    },

    // Update center
    updateCenter: async (id: string, data: CenterFormData): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            method: 'PUT',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<Center>(response);
    },

    // Delete center
    deleteCenter: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}`, {
            method: 'DELETE',
            ...fetchOptions,
            headers: getHeaders()
        });

        if (!response.ok) {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;
            const errorMessage = (data && data.message) || response.statusText;
            throw new Error(`Delete failed ${response.status}: ${errorMessage}`);
        }
    },

    // Approve center
    approveCenter: async (id: string): Promise<Center> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}/approve`, {
            method: 'PATCH',
            ...fetchOptions,
            headers: getHeaders()
        });
        return handleResponse<Center>(response);
    },

    // Reject center
    rejectCenter: async (id: string, reason?: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/centers/${id}/reject`, {
            method: 'POST',
            ...fetchOptions,
            headers: getHeaders(),
            body: JSON.stringify({ rejection_reason: reason })
        });

        if (!response.ok) {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;
            const errorMessage = (data && data.message) || response.statusText;
            throw new Error(`Rejection failed ${response.status}: ${errorMessage}`);
        }
    }
};
