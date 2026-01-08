"use client";

import React, { useState, useEffect } from 'react';
import { SalaryApprovalStats } from '../../../components/transaction-approval/salary/SalaryApprovalStats';
import { SalaryApprovalTable } from '../../../components/transaction-approval/salary/SalaryApprovalTable';
import { financeService } from '../../../services/finance.service';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

export default function SalaryApprovalPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const data = await financeService.getSalaryApprovals();
            setRecords(data);
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch salary records');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await financeService.approveSalary(parseInt(id));
            toast.success('Salary approved successfully');
            // Remove from list or update local state
            setRecords(prev => prev.filter(rec => rec.id.toString() !== id.toString()));
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve salary');
        }
    };

    // Calculate dynamic stats
    const stats = {
        pendingCount: records.length,
        pendingAmount: records.reduce((sum, r) => sum + parseFloat(r.net_payable), 0),
        approvedCount: 0, // In this page we only show what's waiting
        approvedAmount: 0,
        monthlyTotal: records.reduce((sum, r) => sum + parseFloat(r.net_payable), 0),
        monthlyCount: records.length
    };

    if (loading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">Salary Approval</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and authorize pending employee salary payments.</p>
            </div>

            <SalaryApprovalStats
                {...stats}
            />

            <SalaryApprovalTable
                records={records.map(r => ({
                    id: r.id.toString(),
                    processedDate: new Date(r.created_at).toLocaleDateString(),
                    employeeName: r.staff?.full_name || 'Unknown',
                    role: r.staff?.work_info?.designation || r.staff?.role || 'Staff',
                    month: r.month,
                    baseSalary: parseFloat(r.base_salary),
                    adjustments: parseFloat(r.allowances) - parseFloat(r.deductions),
                    totalPaid: parseFloat(r.net_payable),
                    status: r.status
                }))}
                onApprove={handleApprove}
            />
        </div>
    );
}
