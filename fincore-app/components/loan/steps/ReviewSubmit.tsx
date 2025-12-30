'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { LoanFormData, CustomerRecord } from '@/types/loan.types';
import { Staff } from '@/types/staff.types';
import { calculateTotalFees, calculateNetDisbursement, formatCurrency } from '@/utils/loan.utils';

interface ReviewSubmitProps {
    formData: LoanFormData;
    selectedCustomerRecord?: CustomerRecord | null;
    staffs: Staff[];
}

export const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, selectedCustomerRecord, staffs }) => {
    const totalFees = calculateTotalFees(formData);
    const netDisbursement = calculateNetDisbursement(formData);

    const getStaffName = (id: string) => {
        const staff = staffs.find(s => s.staff_id === id);
        return staff ? staff.full_name : id || 'Not selected';
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Center:</span>
                            <span className="font-medium text-gray-900">{formData.center || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Group:</span>
                            <span className="font-medium text-gray-900">{formData.group || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">NIC:</span>
                            <span className="font-medium text-gray-900">{formData.nic || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-medium text-gray-900">
                                {selectedCustomerRecord?.displayName || 'Not selected'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Loan Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Requested Amount:</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(Number(formData.requestedAmount || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Approved Amount:</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(Number(formData.loanAmount || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Interest Rate:</span>
                            <span className="font-medium text-gray-900">{formData.interestRate || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tenure:</span>
                            <span className="font-medium text-gray-900">{formData.tenure || '0'} months</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Fees & Charges</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Processing Fee:</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(Number(formData.processingFee || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Documentation Fee:</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(Number(formData.documentationFee || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Insurance Fee:</span>
                            <span className="font-medium text-gray-900">
                                {formatCurrency(Number(formData.insuranceFee || 0))}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">Total Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-blue-700">Loan Amount:</span>
                            <span className="font-medium text-blue-900">
                                {formatCurrency(Number(formData.loanAmount || 0))}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Total Fees:</span>
                            <span className="font-medium text-blue-900">{formatCurrency(totalFees)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-300">
                            <span className="text-blue-700 font-semibold">Net Disbursement:</span>
                            <span className="font-bold text-blue-900">{formatCurrency(netDisbursement)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Guarantors & Witnesses</h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Guarantor 01:</span>
                                <span className="font-medium text-gray-900">{formData.guarantor1_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Guarantor 02:</span>
                                <span className="font-medium text-gray-900">{formData.guarantor2_name || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Witness 01 (Staff):</span>
                                <span className="font-medium text-gray-900">{getStaffName(formData.witness1_id)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Witness 02 (Staff):</span>
                                <span className="font-medium text-gray-900">{getStaffName(formData.witness2_id)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Guardian Information</h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium text-gray-900">{formData.guardian_name || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">NIC:</span>
                                <span className="font-medium text-gray-900">{formData.guardian_nic || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium text-gray-900">{formData.guardian_phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-start gap-2">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-medium text-gray-900">{formData.guardian_address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-900">Ready to Submit</p>
                        <p className="text-xs text-green-800 mt-1">
                            Please review all information carefully. Once submitted, the loan application will be
                            sent for approval.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
