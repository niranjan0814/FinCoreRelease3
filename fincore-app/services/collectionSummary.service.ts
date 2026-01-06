import { API_BASE_URL, getHeaders } from './api.config';
import { BranchCollection } from '@/components/collections/summary/types';

class CollectionSummaryService {
    async getSummary(date: string, viewType: 'daily' | 'weekly' | 'monthly'): Promise<BranchCollection[]> {
        const url = new URL(`${API_BASE_URL}/collections/summary`);
        url.searchParams.append('date', date);
        url.searchParams.append('view_type', viewType);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to fetch collection summary');
            }

            return result.data;
        } catch (error) {
            console.error('Failed to fetch collection summary:', error);
            throw error;
        }
    }

    async exportSummary(date: string, viewType: string) {
        const url = new URL(`${API_BASE_URL}/collections/summary/export`);
        url.searchParams.append('date', date);
        url.searchParams.append('view_type', viewType);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to export summary');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `collection_summary_${viewType}_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Failed to export summary:', error);
            throw error;
        }
    }
}

export const collectionSummaryService = new CollectionSummaryService();
