
import { API_BASE_URL, getHeaders } from './api.config';
import { ScheduledPayment, CollectionStats } from './collection.types';

export const collectionService = {
    getDuePayments: async (branchId: string, date?: string) => {
        const url = new URL(`${API_BASE_URL}/collections/due`);
        url.searchParams.append('branch_id', branchId);
        if (date) {
            url.searchParams.append('date', date);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: {
                payments: ScheduledPayment[];
                stats: CollectionStats;
            };
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch due payments');
        }

        return result.data;
    }
};
