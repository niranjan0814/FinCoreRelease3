import { SalaryPayment, SalaryStats } from '@/types/salary.types';
import { API_BASE_URL, getHeaders } from './api.config';

// Mock data to ensure UI works before backend integration
const MOCK_STATS: SalaryStats = {
    totalPayroll: 0,
    processedCount: 0,
    averageSalary: 0,
    activeHeadcount: 0,
    eligibleForPayroll: 0
};

const MOCK_HISTORY: SalaryPayment[] = [];

export const salaryService = {
    getStats: async (): Promise<SalaryStats> => {
        try {
            const response = await fetch(`${API_BASE_URL}/payroll/stats`, { headers: getHeaders() });
            if (!response.ok) return MOCK_STATS;
            const json = await response.json();
            return json.data || MOCK_STATS;
        } catch (error) {
            console.error("Error fetching salary stats", error);
            return MOCK_STATS;
        }
    },

    getHistory: async (month?: string, status?: string): Promise<SalaryPayment[]> => {
        try {
            const query = new URLSearchParams();
            if (month) query.append('month', month);
            if (status) query.append('status', status);

            const response = await fetch(`${API_BASE_URL}/payroll/history?${query.toString()}`, { headers: getHeaders() });
            if (!response.ok) return MOCK_HISTORY;
            const json = await response.json();
            return json.data || MOCK_HISTORY;
        } catch (error) {
            console.error("Error fetching salary history", error);
            return MOCK_HISTORY;
        }
    },

    processPayment: async (data: Partial<SalaryPayment>): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/payroll/process`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.message || 'Failed to process payment');
        }
        return await response.json();
    }
};
