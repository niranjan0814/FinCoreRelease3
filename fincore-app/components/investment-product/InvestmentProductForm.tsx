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
    const [formData, setFormData] = useState<InvestmentProductFormData>({
        name: '',
        interest_rate: 0,
        age_limited: 18
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                interest_rate: Number(initialData.interest_rate),
                age_limited: initialData.age_limited
            });
        } else {
            setFormData({ name: '', interest_rate: 0, age_limited: 18 });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{initialData ? 'Edit' : 'Add'} Investment Product</h2>
                        <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Product Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                        <input
                            type="number"
                            value={formData.interest_rate}
                            onChange={e => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Age</label>
                        <input
                            type="number"
                            value={formData.age_limited}
                            onChange={e => setFormData({ ...formData, age_limited: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
                    <button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
                </div>
            </div>
        </div>
    );
}
