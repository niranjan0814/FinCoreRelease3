import React from 'react';
import { X } from 'lucide-react';
import { NewShareholder } from '@/types/shareholder.types';

interface AddShareholderModalProps {
    show: boolean;
    onClose: () => void;
    newShareholder: NewShareholder;
    setNewShareholder: React.Dispatch<React.SetStateAction<NewShareholder>>;
    onAdd: () => void;
}

export function AddShareholderModal({
    show,
    onClose,
    newShareholder,
    setNewShareholder,
    onAdd
}: AddShareholderModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Add New Shareholder</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Shareholder Name *</label>
                        <input
                            type="text"
                            value={newShareholder.name}
                            onChange={(e) =>
                                setNewShareholder((prev) => ({
                                    ...prev,
                                    name: e.target.value
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Number of Shares *</label>
                            <input
                                type="number"
                                value={newShareholder.shares}
                                onChange={(e) =>
                                    setNewShareholder((prev) => ({
                                        ...prev,
                                        shares: e.target.value
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Enter shares"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Investment (LKR) *</label>
                            <input
                                type="number"
                                value={newShareholder.totalInvestment}
                                onChange={(e) =>
                                    setNewShareholder((prev) => ({
                                        ...prev,
                                        totalInvestment: e.target.value
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Share Percentage (%) *</label>
                        <input
                            type="number"
                            value={newShareholder.percentage}
                            onChange={(e) =>
                                setNewShareholder((prev) => ({
                                    ...prev,
                                    percentage: e.target.value
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter percentage"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">NIC Number *</label>
                        <input
                            type="text"
                            value={newShareholder.nic}
                            onChange={(e) =>
                                setNewShareholder((prev) => ({
                                    ...prev,
                                    nic: e.target.value
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Enter NIC number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Contact Number *</label>
                        <input
                            type="tel"
                            value={newShareholder.contact}
                            onChange={(e) =>
                                setNewShareholder((prev) => ({
                                    ...prev,
                                    contact: e.target.value
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="+94 XX XXX XXXX"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Address</label>
                        <textarea
                            rows={2}
                            value={newShareholder.address}
                            onChange={(e) =>
                                setNewShareholder((prev) => ({
                                    ...prev,
                                    address: e.target.value
                                }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            placeholder="Enter address"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        onClick={onAdd}
                    >
                        Add Shareholder
                    </button>
                </div>
            </div>
        </div>
    );
}
