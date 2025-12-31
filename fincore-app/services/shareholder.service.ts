import { API_BASE_URL, getHeaders } from './api.config';
import { Shareholder } from '@/types/shareholder.types';

export const shareholderService = {
    async getAll(): Promise<Shareholder[]> {
        const response = await fetch(`${API_BASE_URL}/shareholders`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch shareholders');
        }

        const result = await response.json();
        return result.data;
    },

    async getById(id: string): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async create(data: Partial<Shareholder>): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async update(id: string, data: Partial<Shareholder>): Promise<Shareholder> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update shareholder');
        }

        const result = await response.json();
        return result.data;
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/shareholders/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to delete shareholder');
        }
    },
};
