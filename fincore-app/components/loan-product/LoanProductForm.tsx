'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { LoanProduct, LoanProductFormData } from '../../types/loan-product.types';

interface LoanProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: LoanProductFormData) => void;
    initialData?: LoanProduct | null;
}

const defaultFormData: LoanProductFormData = {
    product_name: '',
    product_details: '',
    term_type: 'Monthly',
    regacine: '',
    interest_rate: 0,
    loan_limited_amount: 0,
    loan_amount: 0,
    loan_term: 12,
    customer_age_limited: 18,
    customer_monthly_income: 0,
    guarantor_monthly_income: 0,
};

export function LoanProductForm({ isOpen, onClose, onSave, initialData }: LoanProductFormProps) {
    const [formData, setFormData] = useState<LoanProductFormData>(defaultFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                product_name: initialData.product_name,
                product_details: initialData.product_details || '',
                term_type: initialData.term_type,
                regacine: initialData.regacine || '',
                interest_rate: Number(initialData.interest_rate),
                loan_limited_amount: Number(initialData.loan_limited_amount),
                loan_amount: Number(initialData.loan_amount),
                loan_term: initialData.loan_term,
                customer_age_limited: initialData.customer_age_limited || 18,
                customer_monthly_income: Number(initialData.customer_monthly_income),
                guarantor_monthly_income: Number(initialData.guarantor_monthly_income),
            });
        } else {
            setFormData(defaultFormData);
        }
    }, [initialData, isOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.product_name.trim()) newErrors.product_name = 'Product name is required';
        if (!formData.term_type) newErrors.term_type = 'Term type is required';
        if (formData.interest_rate < 0 || formData.interest_rate > 100) newErrors.interest_rate = 'Interest rate must be between 0 and 100';
        if (formData.loan_amount <= 0) newErrors.loan_amount = 'Loan amount must be greater than 0';
        if (formData.loan_term <= 0) newErrors.loan_term = 'Loan term must be greater than 0';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Loan Product' : 'Add New Loan Product'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div className="md:col-span-2">
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Product Name *</label>
                            <input
                                type="text"
                                value={formData.product_name}
                                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.product_name ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="e.g. Micro Business Loan"
                            />
                            {errors.product_name && <p className="text-red-500 text-xs mt-1">{errors.product_name}</p>}
                        </div>

                        {/* Term Type */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Term Type *</label>
                            <select
                                value={formData.term_type}
                                onChange={(e) => setFormData({ ...formData, term_type: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                            >
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Annually">Annually</option>
                            </select>
                        </div>

                        {/* Interest Rate */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Interest Rate (%) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.interest_rate}
                                onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.interest_rate ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.interest_rate && <p className="text-red-500 text-xs mt-1">{errors.interest_rate}</p>}
                        </div>

                        {/* Loan Amount */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Loan Amount *</label>
                            <input
                                type="number"
                                value={formData.loan_amount}
                                onChange={(e) => setFormData({ ...formData, loan_amount: parseFloat(e.target.value) || 0 })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.loan_amount ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.loan_amount && <p className="text-red-500 text-xs mt-1">{errors.loan_amount}</p>}
                        </div>

                        {/* Loan Term */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Loan Term (Periods) *</label>
                            <input
                                type="number"
                                value={formData.loan_term}
                                onChange={(e) => setFormData({ ...formData, loan_term: parseInt(e.target.value) || 0 })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.loan_term ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.loan_term && <p className="text-red-500 text-xs mt-1">{errors.loan_term}</p>}
                        </div>

                        {/* Regacine */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Regacine / Category</label>
                            <input
                                type="text"
                                value={formData.regacine}
                                onChange={(e) => setFormData({ ...formData, regacine: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Enter category"
                            />
                        </div>

                        {/* Loan Limited Amount */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Loan Limited Amount</label>
                            <input
                                type="number"
                                value={formData.loan_limited_amount}
                                onChange={(e) => setFormData({ ...formData, loan_limited_amount: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Customer Age Limited */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Min Customer Age</label>
                            <input
                                type="number"
                                value={formData.customer_age_limited}
                                onChange={(e) => setFormData({ ...formData, customer_age_limited: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Customer Monthly Income */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Min Monthly Income</label>
                            <input
                                type="number"
                                value={formData.customer_monthly_income}
                                onChange={(e) => setFormData({ ...formData, customer_monthly_income: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Guarantor Monthly Income */}
                        <div>
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Min Guarantor Income</label>
                            <input
                                type="number"
                                value={formData.guarantor_monthly_income}
                                onChange={(e) => setFormData({ ...formData, guarantor_monthly_income: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Product Details */}
                        <div className="md:col-span-2">
                            <label className="block font-semibold text-gray-900 mb-2 text-sm">Product Details</label>
                            <textarea
                                value={formData.product_details}
                                onChange={(e) => setFormData({ ...formData, product_details: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Describe the loan product..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-lg sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-white transition-colors font-semibold text-sm text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm"
                    >
                        {initialData ? 'Update Product' : 'Create Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}
