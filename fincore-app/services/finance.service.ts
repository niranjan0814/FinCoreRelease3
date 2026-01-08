import { API_BASE_URL, getHeaders } from './api.config';
import { BranchExpense, ExpenseFormData, FinanceApiResponse } from '../types/finance.types';

export const financeService = {
    getBranchTransactions: async (branchId?: number, date?: string, period: string = 'day'): Promise<{ activities: BranchExpense[], stats: any }> => {
        let url = `${API_BASE_URL}/finance/branch-transactions`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        if (date) params.append('date', date);
        params.append('period', period);
        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch branch transactions');
        }

        const json: FinanceApiResponse<{ activities: BranchExpense[], stats: any }> = await response.json();
        return json.data;
    },

    recordExpense: async (data: any): Promise<BranchExpense> => {
        const response = await fetch(`${API_BASE_URL}/finance/expenses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        const json: FinanceApiResponse<BranchExpense> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to record activity');
        }

        return json.data;
    },

    getUnsettledReceipts: async (branchId?: number, status: string = 'active'): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/unsettled-receipts`;
        const params = new URLSearchParams();
        if (branchId) params.append('branch_id', branchId.toString());
        params.append('status', status);
        url += `?${params.toString()}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch receipts');
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    settleReceipt: async (receiptId: number, staffId: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/settle-receipt`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ receipt_id: receiptId, staff_id: staffId })
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to settle receipt');
        }

        return json.data;
    },

    getApprovedLoans: async (branchId?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/approved-loans`;
        if (branchId) url += `?branch_id=${branchId}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch approved loans');
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    disburseLoan: async (loanId: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/loans/${loanId}/disburse`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to disburse loan');
        }

        return json.data;
    },

    getSalaryApprovals: async (branchId?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/salary-approvals`;
        if (branchId) url += `?branch_id=${branchId}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch salary approvals');
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    approveSalary: async (salaryId: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/salaries/${salaryId}/approve`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to approve salary');
        }

        return json.data;
    },

    getPendingSalaries: async (branchId?: number): Promise<any[]> => {
        let url = `${API_BASE_URL}/finance/pending-salaries`;
        if (branchId) url += `?branch_id=${branchId}`;

        const response = await fetch(url, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pending salaries');
        }

        const json: FinanceApiResponse<any[]> = await response.json();
        return json.data;
    },

    disburseSalary: async (salaryId: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/finance/salaries/${salaryId}/disburse`, {
            method: 'POST',
            headers: getHeaders()
        });

        const json: FinanceApiResponse<any> = await response.json();

        if (!response.ok) {
            throw new Error(json.message || 'Failed to disburse salary');
        }

        return json.data;
    }
};
