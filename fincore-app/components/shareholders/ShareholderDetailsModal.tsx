import React from 'react';
import { X } from 'lucide-react';
import { Shareholder } from '@/types/shareholder.types';

interface ShareholderDetailsModalProps {
    show: boolean;
    onClose: () => void;
    shareholder: Shareholder | null;
}

export function ShareholderDetailsModal({
    show,
    onClose,
    shareholder
}: ShareholderDetailsModalProps) {
    if (!show || !shareholder) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Shareholder Details</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                                {shareholder.name.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{shareholder.name}</p>
                            {shareholder.nic && (
                                <p className="text-gray-500 text-xs">NIC: {shareholder.nic}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Shares</p>
                            <p className="font-medium text-gray-900">
                                {shareholder.shares.toLocaleString()} shares
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Percentage</p>
                            <p className="font-medium text-gray-900">{shareholder.percentage}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Total Investment</p>
                            <p className="font-medium text-gray-900">
                                LKR {shareholder.total_investment.toLocaleString()}
                            </p>
                        </div>
                        {shareholder.contact && (
                            <div>
                                <p className="text-xs text-gray-500">Contact</p>
                                <p className="font-medium text-gray-900">{shareholder.contact}</p>
                            </div>
                        )}
                    </div>

                    {shareholder.address && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Address</p>
                            <p className="text-gray-900">{shareholder.address}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
