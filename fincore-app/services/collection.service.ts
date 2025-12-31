
import { API_BASE_URL, getHeaders } from './api.config';
import { ScheduledPayment, CollectionStats, PaymentCollectionRequest, PaymentHistoryItem } from './collection.types';

export const collectionService = {
    /**
     * Get due payments for a branch and date
     */
    getDuePayments: async (branchId: string, csuId?: string, date?: string) => {
        const url = new URL(`${API_BASE_URL}/collections/due`);
        url.searchParams.append('branch_id', branchId);
        if (csuId) {
            url.searchParams.append('CSU_id', csuId);
        }
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
    },

    /**
     * Collect payment for a loan
     */
    collectPayment: async (paymentData: PaymentCollectionRequest) => {
        const response = await fetch(`${API_BASE_URL}/collections/collect`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to collect payment');
        }

        return result.data;
    },

    /**
     * Get payment history for a loan
     */
    getPaymentHistory: async (loanId: string): Promise<PaymentHistoryItem[]> => {
        const response = await fetch(`${API_BASE_URL}/collections/history/${loanId}`, {
            method: 'GET',
            headers: getHeaders()
        });

        const result: {
            success: boolean;
            data: PaymentHistoryItem[];
            message?: string;
        } = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to fetch payment history');
        }

        return result.data;
    }
};
