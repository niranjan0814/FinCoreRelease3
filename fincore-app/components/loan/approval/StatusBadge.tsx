import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { LoanStatus } from '@/types/loan-approval.types';

interface StatusBadgeProps {
    status: LoanStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'Pending 1st':
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Pending 1st Approval</span>;
        case 'Pending 2nd':
            return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Pending 2nd Approval</span>;
        case 'Approved':
            return (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />Approved
                </span>
            );
        case 'Sent Back':
            return (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs inline-flex items-center gap-1">
                    <XCircle className="w-3 h-3" />Sent Back
                </span>
            );
        default:
            return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{status}</span>;
    }
};
