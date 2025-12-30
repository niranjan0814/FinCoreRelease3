'use client';

import React from 'react';
import { DraftItem } from '@/types/loan.types';

interface DraftModalProps {
    isOpen: boolean;
    drafts: DraftItem[];
    onClose: () => void;
    onLoad: (draftId: string) => void;
    onDelete: (draftId: string) => void;
}

export const DraftModal: React.FC<DraftModalProps> = ({
    isOpen,
    drafts,
    onClose,
    onLoad,
    onDelete,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-gray-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Saved Drafts</p>
                        <p className="text-xs text-gray-500">Select a draft to continue</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Close
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                    {drafts.length === 0 && (
                        <div className="p-4 text-sm text-gray-600">No drafts saved yet.</div>
                    )}
                    {drafts.map((draft) => (
                        <div key={draft.id} className="p-4 flex items-center justify-between text-sm">
                            <div>
                                <p className="font-medium text-gray-900">{draft.name}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(draft.savedAt).toLocaleString()} • Step {draft.currentStep || 1}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onLoad(draft.id)}
                                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => onDelete(draft.id)}
                                    className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
