'use client';

import { LoanFormData } from '@/types/loan.types';
import { LoanProduct } from '@/types/loan-product.types';
import { RENTAL_TYPES, LOAN_LIMITS } from '@/constants/loan.constants';

interface LoanDetailsProps {
    formData: LoanFormData;
    loanProducts: LoanProduct[];
    onFieldChange: (field: keyof LoanFormData, value: string) => void;
    customerActiveLoans?: number[];
}

export const LoanDetails: React.FC<LoanDetailsProps> = ({ formData, loanProducts, onFieldChange, customerActiveLoans = [] }) => {
    const selectedProduct = loanProducts.find(p => p.id === Number(formData.loanProduct));
    const isAlreadyTaken = customerActiveLoans.includes(Number(formData.loanProduct));

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Select Loan Product *
                    </label>
                    <select
                        value={formData.loanProduct}
                        onChange={(e) => onFieldChange('loanProduct', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        <option value="">Choose a product</option>
                        {loanProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.product_name} {customerActiveLoans.includes(product.id) ? '(Already Active)' : ''}
                            </option>
                        ))}
                    </select>
                    {isAlreadyTaken && selectedProduct && (
                        <p className="text-sm font-bold text-red-600 mt-2 animate-pulse">
                            Wait! This customer already has an active {selectedProduct.product_name} loan.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Requested Amount (LKR) *
                    </label>
                    <input
                        type="number"
                        value={formData.requestedAmount}
                        onChange={(e) => onFieldChange('requestedAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Enter amount"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Approved Amount (LKR) *
                    </label>
                    <input
                        type="number"
                        value={formData.loanAmount}
                        onChange={(e) => onFieldChange('loanAmount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Enter approved amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        System maximum: LKR {LOAN_LIMITS.MAX_AMOUNT.toLocaleString()}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Interest Rate (%) *
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={formData.interestRate}
                        onChange={(e) => onFieldChange('interestRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="e.g., 12.5"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Rental Type *</label>
                    <select
                        value={formData.rentalType}
                        onChange={(e) => onFieldChange('rentalType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                        {RENTAL_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Tenure (months) *
                    </label>
                    <input
                        type="number"
                        value={formData.tenure}
                        onChange={(e) => onFieldChange('tenure', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Enter tenure"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Fees & Charges</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Processing Fee (LKR)
                        </label>
                        <input
                            type="number"
                            value={formData.processingFee}
                            onChange={(e) => onFieldChange('processingFee', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Documentation Fee (LKR)
                        </label>
                        <input
                            type="number"
                            value={formData.documentationFee}
                            onChange={(e) => onFieldChange('documentationFee', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Insurance Fee (LKR)
                        </label>
                        <input
                            type="number"
                            value={formData.insuranceFee}
                            onChange={(e) => onFieldChange('insuranceFee', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Remarks</label>
                <textarea
                    value={formData.remarks}
                    onChange={(e) => onFieldChange('remarks', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Enter any additional remarks..."
                />
            </div>
        </div>
    );
};
