import { Customer, CustomerFormData } from '../types/customer.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const customerService = {
    /**
     * Get all customers with optional filters
     */
    getCustomers: async (filters?: {
        full_name?: string;
        customer_code?: string;
        gender?: string;
        center_id?: string;
        branch_id?: string;
        grp_id?: string;
    }): Promise<Customer[]> => {
        try {
            const params = new URLSearchParams();
            if (filters?.full_name) params.append('full_name', filters.full_name);
            if (filters?.customer_code) params.append('customer_code', filters.customer_code);
            if (filters?.gender) params.append('gender', filters.gender);
            if (filters?.center_id) params.append('center_id', filters.center_id);
            if (filters?.branch_id) params.append('branch_id', filters.branch_id);
            if (filters?.grp_id) params.append('grp_id', filters.grp_id);

            const queryString = params.toString();
            const url = `${API_BASE_URL}/customers${queryString ? `?${queryString}` : ''}`;

            const response = await fetch(url, { headers: getHeaders() });

            if (!response.ok) return [];

            const data = await response.json();

            // Handle different response formats
            if (data?.data && Array.isArray(data.data)) {
                return data.data;
            }

            return [];
        } catch (error) {
            console.error("Error fetching customers", error);
            return [];
        }
    },

    /**
     * Get customer constants (enums, locations, etc.)
     */
    getConstants: async (): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/customers/constants`, {
                headers: getHeaders()
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.data || null;
        } catch (error) {
            console.error("Error fetching customer constants", error);
            return null;
        }
    },


    /**
     * Get a specific customer by ID
     */
    getCustomer: async (id: string): Promise<Customer | null> => {
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.data || null;
        } catch (error) {
            console.error("Error fetching customer", error);
            return null;
        }
    },

    /**
     * Create a new customer (Field Officer only)
     */
    createCustomer: async (customerData: CustomerFormData): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/customers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(customerData)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to create customer');
            throw new Error(msg);
        }

        return data;
    },

    /**
     * Update customer details
     */
    updateCustomer: async (id: string, customerData: Partial<CustomerFormData>): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(customerData)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to update customer');
            throw new Error(msg);
        }

        return data;
    },

    /**
     * Delete a customer
     */
    deleteCustomer: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete customer');
        }

        return data;
    },

    /**
     * Import customers from CSV
     */
    importCustomers: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/customers/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
                // Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import customers');
        }

        return data;
    },

    /**
     * Export customers to CSV
     */
    exportCustomers: async (): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/customers/export`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export customers');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Check if a customer is eligible for center transfer
     */
    checkTransferEligibility: async (id: string): Promise<{ eligible: boolean; message?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${id}/transfer-eligibility`, {
                headers: getHeaders()
            });
            const data = await response.json();
            return {
                eligible: response.ok,
                message: data.message
            };
        } catch (error) {
            console.error("Error checking transfer eligibility", error);
            return { eligible: false, message: "Could not verify eligibility" };
        }
    }
};
