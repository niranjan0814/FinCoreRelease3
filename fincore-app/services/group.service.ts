import { Group, GroupFormData, ApiResponse } from '../types/group.types';
import { API_BASE_URL, getHeaders } from './api.config';

const handleResponse = async (response: Response) => {
    const data = await response.json();

    if (!response.ok) {
        if (data && (response.status === 422 || response.status === 409)) {
            const error = new Error(data.message || 'Validation failed');
            (error as any).errors = data.errors;
            throw error;
        }
        throw new Error(data.message || 'Request failed');
    }

    return data;
};

export const groupService = {
    // Get all groups
    getGroups: async (): Promise<Group[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups`, {
                headers: getHeaders()
            });

            const json: ApiResponse<Group[]> = await handleResponse(response);
            return json.data || [];
        } catch (error) {
            console.error('Failed to fetch groups:', error);
            return [];
        }
    },

    // Get single group by ID
    getGroupById: async (id: number): Promise<Group> => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
                headers: getHeaders()
            });

            const json: ApiResponse<Group> = await handleResponse(response);
            return json.data;
        } catch (error) {
            console.error('Failed to fetch group:', error);
            throw error;
        }
    },

    // Create new group
    createGroup: async (data: GroupFormData): Promise<Group> => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            const json: ApiResponse<Group> = await handleResponse(response);
            return json.data;
        } catch (error) {
            console.error('Failed to create group:', error);
            throw error;
        }
    },

    // Update group
    updateGroup: async (id: number, data: GroupFormData): Promise<Group> => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });

            const json: ApiResponse<Group> = await handleResponse(response);
            return json.data;
        } catch (error) {
            console.error('Failed to update group:', error);
            throw error;
        }
    },

    // Delete group
    deleteGroup: async (id: number): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            await handleResponse(response);
        } catch (error) {
            console.error('Failed to delete group:', error);
            throw error;
        }
    }
};
