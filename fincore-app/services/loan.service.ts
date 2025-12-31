import { Loan, LoanStats } from '../types/loan.types';
import { API_BASE_URL, getHeaders } from './api.config';

export interface LoansResponse {
    status: string;
    data: Loan[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        stats: LoanStats;
    };
}

export const loanService = {
    getLoans: async (params: { search?: string; status?: string; page?: number; per_page?: number }): Promise<LoansResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.page) query.append('page', params.page.toString());
        if (params.per_page) query.append('per_page', params.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/loans?${query.toString()}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loans');
        return json;
    },

    createLoan: async (data: any): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json = await response.json();
        if (!response.ok) {
            let errorMessage = json.message || 'Failed to submit loan application';
            if (json.errors) {
                const details = Object.values(json.errors).flat().join(', ');
                errorMessage += `: ${details}`;
            }
            throw new Error(errorMessage);
        }
        return json.data;
    },

    getLoanById: async (id: number | string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
            headers: getHeaders()
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to fetch loan details');
        return json.data;
    },

    approveLoan: async (id: number | string, action: 'approve' | 'send_back', reason?: string): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ action, reason })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve loan');
        return json.data;
    },

    /**
     * Export loans to CSV
     */
    exportLoans: async (): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/loans/export`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export loans');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loans_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Import loans from CSV
     */
    importLoans: async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/loans/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to import loans');
        }

        return data;
    }
};
