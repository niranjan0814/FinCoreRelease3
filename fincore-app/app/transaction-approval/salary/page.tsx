"use client";

import React, { useState } from 'react';
import { SalaryApprovalStats } from '../../../components/transaction-approval/salary/SalaryApprovalStats';
import { SalaryApprovalTable } from '../../../components/transaction-approval/salary/SalaryApprovalTable';
import { toast } from 'react-toastify';

export default function SalaryApprovalPage() {
    // Mock data based on the screenshot
    const [records, setRecords] = useState<{
        id: string;
        processedDate: string;
        employeeName: string;
        role: string;
        month: string;
        baseSalary: number;
        adjustments: number;
        totalPaid: number;
        status: 'Pending' | 'Approved' | 'Rejected';
    }[]>([
        {
            id: '1',
            processedDate: 'Jan 07, 2026',
            employeeName: 'Jane Smith',
            role: 'HR',
            month: '2026-01',
            baseSalary: 55000,
            adjustments: 0,
            totalPaid: 55000,
            status: 'Pending' as const
        }
    ]);

    const handleApprove = (id: string) => {
        setRecords(prev => prev.map(rec =>
            rec.id === id ? { ...rec, status: 'Approved' } : rec
        ));
        toast.success('Salary approved successfully');
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">Salary Approval</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and authorize pending employee salary payments.</p>
            </div>

            <SalaryApprovalStats
                pendingCount={1}
                pendingAmount={55000}
                approvedCount={0}
                approvedAmount={0}
                monthlyTotal={55000}
                monthlyCount={1}
            />

            <SalaryApprovalTable
                records={records}
                onApprove={handleApprove}
            />
        </div>
    );
}
