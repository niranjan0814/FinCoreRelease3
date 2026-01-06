import { API_BASE_URL, getHeaders } from './api.config';
import type { DueListSummary } from '@/components/collections/due-list/DueListStats';
import type { DuePayment } from '@/components/collections/due-list/DueListTable';

export const dueListService = {
    /**
     * Get due list for a specific date and optional center
     */
    getDueList: async (date: string, centerId?: string, showAll?: boolean, branchId?: string): Promise<DuePayment[]> => {
        const url = new URL(`${API_BASE_URL}/due-list`);
        url.searchParams.append('date', date);

        if (branchId) {
            url.searchParams.append('branch_id', branchId);
        }

        if (centerId) {
            url.searchParams.append('center_id', centerId);
        }

        if (showAll) {
            url.searchParams.append('show_all', '1');
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
        });

        const result: {
            success: boolean;
            data: DuePayment[];
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due list');
        }

        return result.data;
    },

    /**
     * Get due list summary statistics
     */
    getDueListSummary: async (): Promise<DueListSummary> => {
        const response = await fetch(`${API_BASE_URL}/due-list/summary`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const result: {
            success: boolean;
            data: DueListSummary;
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due list summary');
        }

        return result.data;
    },

    /**
     * Export due list to CSV
     */
    exportDueList: async (date: string, centerId?: string): Promise<void> => {
        const url = new URL(`${API_BASE_URL}/due-list/export`);
        url.searchParams.append('date', date);

        if (centerId) {
            url.searchParams.append('center_id', centerId);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to export due list');
        }

        const blob = await response.blob();
        const exportUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `due_list_${date}.csv`;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(exportUrl);
        document.body.removeChild(a);
    },

    /**
     * Extend due date for a loan
     */
    extendDueDate: async (loanId: string, originalDate: string, newDate: string, reason: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/collections/loans/${loanId}/extend-due-date`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                original_due_date: originalDate,
                new_due_date: newDate,
                reason,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to extend due date');
        }
    },
};
