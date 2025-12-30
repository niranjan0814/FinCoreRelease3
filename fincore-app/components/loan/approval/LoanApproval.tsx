'use client';

import React from 'react';
import { useLoanApproval } from '@/hooks/loan/useLoanApproval';
import { ApprovalFilters } from './ApprovalFilters';
import { ApprovalTable } from './ApprovalTable';
import { ApprovalModal } from './ApprovalModal';

export function LoanApproval() {
    const {
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        viewingLoan,
        setViewingLoan,
        filteredLoans,
        handleFirstApproval,
        handleSecondApproval,
        isLoading,
        error
    } = useLoanApproval();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Loan Approval</h1>
                    <p className="text-sm text-gray-600 mt-1">Review and approve loan applications</p>
                </div>
            </div>

            {/* Filters */}
            <ApprovalFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onStatusChange={setFilterStatus}
            />

            {/* Loans Table */}
            <ApprovalTable
                loans={filteredLoans}
                onView={setViewingLoan}
            />

            {/* View Loan Details Modal */}
            {viewingLoan && (
                <ApprovalModal
                    loan={viewingLoan}
                    onClose={() => setViewingLoan(null)}
                    onFirstApproval={handleFirstApproval}
                    onSecondApproval={handleSecondApproval}
                />
            )}
        </div>
    );
}
