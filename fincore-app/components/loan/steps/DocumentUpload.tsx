'use client';

import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { DOCUMENT_TYPES } from '@/constants/loan.constants';

export const DocumentUpload: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h2>

            <div className="grid grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map((doc) => (
                    <div
                        key={doc}
                        className="border border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">{doc}</p>
                        <p className="text-xs text-gray-500 mt-1">Click to upload or drag and drop</p>
                    </div>
                ))}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-yellow-900">Document Guidelines</p>
                        <ul className="text-xs text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                            <li>All documents must be clear and legible</li>
                            <li>Accepted formats: PDF, JPG, PNG (Max 5MB per file)</li>
                            <li>Customer photo must be recent (within 3 months)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
