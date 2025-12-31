import { useState, useEffect, useCallback } from 'react';
import { DraftItem, DraftPayload, LoanFormData } from '@/types/loan.types';
import { STORAGE_KEYS, LOAN_LIMITS } from '@/constants/loan.constants';
import { generateDraftName } from '@/utils/loan.utils';

export const useDraftManager = (
    formData: LoanFormData,
    currentStep: number,
    selectedCustomerName?: string,
    onLoadDraft?: (data: LoanFormData, step: number) => void
) => {
    const [drafts, setDrafts] = useState<DraftItem[]>([]);
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
    const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedList = localStorage.getItem(STORAGE_KEYS.DRAFT_LIST);
        if (savedList) {
            try {
                const parsedList = JSON.parse(savedList);
                if (Array.isArray(parsedList)) {
                    setDrafts(parsedList);
                }
            } catch (error) {
                console.error('Failed to load draft list', error);
            }
        }
    }, [onLoadDraft]);

    const saveDraft = useCallback(() => {
        const payload: DraftPayload = {
            formData: { ...formData, status: 'draft' },
            currentStep,
        };

        const name = selectedCustomerName || generateDraftName(
            undefined,
            formData.nic,
            formData.customer
        );

        const newDraft: DraftItem = {
            id: Date.now().toString(),
            name,
            savedAt: new Date().toISOString(),
            ...payload,
        };

        try {
            localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(payload));

            const existing = localStorage.getItem(STORAGE_KEYS.DRAFT_LIST);
            const parsed: DraftItem[] = existing ? JSON.parse(existing) : [];
            const updated = [newDraft, ...parsed].slice(0, LOAN_LIMITS.MAX_DRAFT_COUNT);

            localStorage.setItem(STORAGE_KEYS.DRAFT_LIST, JSON.stringify(updated));
            setDrafts(updated);

            return { success: true, message: 'Draft saved successfully' };
        } catch (error) {
            console.error('Failed to save draft', error);
            return { success: false, message: 'Could not save draft. Please try again.' };
        }
    }, [formData, currentStep, selectedCustomerName]);

    const loadDraft = useCallback(
        (draftId: string) => {
            const draft = drafts.find((item) => item.id === draftId);
            if (!draft) return { success: false, message: 'Draft not found' };

            if (onLoadDraft) {
                onLoadDraft(draft.formData, draft.currentStep || 1);
            }

            setLoadedDraftId(draftId);
            setIsDraftModalOpen(false);
            return { success: true, message: `Draft "${draft.name}" loaded` };
        },
        [drafts, onLoadDraft]
    );

    const deleteDraft = useCallback((draftId: string) => {
        const updated = drafts.filter((item) => item.id !== draftId);
        setDrafts(updated);
        localStorage.setItem(STORAGE_KEYS.DRAFT_LIST, JSON.stringify(updated));
        if (loadedDraftId === draftId) {
            setLoadedDraftId(null);
        }
        return { success: true, message: 'Draft deleted' };
    }, [drafts, loadedDraftId]);

    return {
        drafts,
        isDraftModalOpen,
        setIsDraftModalOpen,
        loadedDraftId,
        setLoadedDraftId,
        saveDraft,
        loadDraft,
        deleteDraft,
    };
};
