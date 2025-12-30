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
    getLoans: async (params: { search?: string; status?: string; page?: number }): Promise<LoansResponse> => {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.status) query.append('status', params.status);
        if (params.page) query.append('page', params.page.toString());

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
        if (!response.ok) throw new Error(json.message || 'Failed to submit loan application');
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

    approveLoan: async (id: number | string, action: 'approve' | 'send_back'): Promise<Loan> => {
        const response = await fetch(`${API_BASE_URL}/loans/${id}/approve`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ action })
        });

        const json = await response.json();
        if (!response.ok) throw new Error(json.message || 'Failed to approve loan');
        return json.data;
    }
};
