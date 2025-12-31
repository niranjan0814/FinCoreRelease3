'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { InvestmentProduct, InvestmentProductFormData } from '../../types/investment-product.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: InvestmentProductFormData) => void;
    initialData?: InvestmentProduct | null;
}

export function InvestmentProductForm({ isOpen, onClose, onSave, initialData }: Props) {
    // We use strings for input states to handle leading zeros and empty states better
    const [name, setName] = useState('');
    const [interestRate, setInterestRate] = useState('0');
    const [ageLimit, setAgeLimit] = useState('18');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setInterestRate(String(Number(initialData.interest_rate)));
                setAgeLimit(String(initialData.age_limited || 0));
            } else {
                setName('');
                setInterestRate('0');
                setAgeLimit('18');
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSave({
            name,
            interest_rate: parseFloat(interestRate) || 0,
            age_limited: parseInt(ageLimit) || 0
        });
    };

    // Helper to handle numeric input changes and remove leading zeros
    const handleNumericChange = (setter: (val: string) => void, val: string) => {
        // Remove leading zero if followed by other digits
        const cleanVal = val.replace(/^0+(?!$)/, '');
        setter(cleanVal || '0');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit' : 'Add'} Investment Product</h2>
                        <p className="text-sm text-gray-500 mt-1">Configure product parameters</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Fixed Deposit - 12 Months"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={interestRate}
                                onChange={e => handleNumericChange(setInterestRate, e.target.value)}
                                onFocus={e => e.target.value === '0' && setInterestRate('')}
                                onBlur={e => e.target.value === '' && setInterestRate('0')}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Min Age</label>
                            <input
                                type="number"
                                value={ageLimit}
                                onChange={e => handleNumericChange(setAgeLimit, e.target.value)}
                                onFocus={e => e.target.value === '0' && setAgeLimit('')}
                                onBlur={e => e.target.value === '' && setAgeLimit('0')}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all shadow-sm active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                    >
                        Save Product
                    </button>
                </div>
            </div>
        </div>
    );
}
