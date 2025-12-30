'use client'

import React, { useState, useEffect } from 'react';
import { CollectionStats } from './CollectionStats';
import { CollectionFilters } from './CollectionFilters';
import { ScheduledPaymentsTable } from './ScheduledPaymentsTable';
import { PaymentModal } from './PaymentModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { ScheduledPayment, CollectionStats as StatsType } from '../../services/collection.types';
import { collectionService } from '../../services/collection.service';
import { branchService } from '../../services/branch.service';
import { toast } from 'react-toastify';

export function CollectionScreen() {
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [payments, setPayments] = useState<ScheduledPayment[]>([]);
    const [stats, setStats] = useState<StatsType>({
        totalDue: 0,
        collected: 0,
        arrears: 0,
        suspense: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<ScheduledPayment | null>(null);
    const [receiptAmount, setReceiptAmount] = useState('');

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchService.getBranchesAll(); // This now returns filtered list from backend
                // Helper to extract data array if wrapped
                const data = Array.isArray(response) ? response : (response as any).data || [];
                setBranches(data);

                // Auto-select if only one branch (Field Officer case)
                if (data.length === 1) {
                    setSelectedBranch(String(data[0].id));
                }
            } catch (error) {
                console.error('Failed to fetch branches', error);
                toast.error('Failed to load branches');
            }
        };
        fetchBranches();
    }, []);

    // Fetch payments when branch or date changes
    useEffect(() => {
        if (!selectedBranch) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await collectionService.getDuePayments(selectedBranch, selectedDate);
                setPayments(data.payments);
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch collection data', error);
                toast.error('Failed to load collection data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedBranch, selectedDate]);

    const handleCollectPayment = (customer: ScheduledPayment) => {
        setSelectedCustomer(customer);
        setShowPaymentModal(true);
    };

    const handleProcessPayment = (amount: string, type: 'full' | 'partial', method: string, remarks: string) => {
        // In a real app, you would send this data to the backend here
        console.log('Processing payment:', { amount, type, method, remarks, customer: selectedCustomer });

        setReceiptAmount(amount);
        setShowPaymentModal(false);
        setShowReceiptPreview(true);
    };

    const handlePrintReceipt = () => {
        window.print();
        setShowReceiptPreview(false);
    };

    const getBranchName = () => {
        const branch = branches.find(b => String(b.id) === selectedBranch);
        return branch ? branch.branch_name : '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Collection Screen</h1>
                <p className="text-sm text-gray-500 mt-1">Collect payments and generate receipts</p>
            </div>

            {/* Filter Section */}
            <CollectionFilters
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchChange={setSelectedBranch}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />

            {selectedBranch && (
                <>
                    {/* Statistics Cards */}
                    <CollectionStats stats={stats} />

                    {/* Scheduled Payments Table */}
                    {isLoading ? (
                        <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-500">Loading payments...</p>
                        </div>
                    ) : (
                        <ScheduledPaymentsTable
                            payments={payments}
                            selectedCenter={getBranchName()} // Reusing prop name for display
                            onCollectPayment={handleCollectPayment}
                        />
                    )}
                </>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                customer={selectedCustomer}
                onClose={() => setShowPaymentModal(false)}
                onProcessPayment={handleProcessPayment}
            />

            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                isOpen={showReceiptPreview}
                customer={selectedCustomer}
                paymentAmount={receiptAmount}
                onClose={() => setShowReceiptPreview(false)}
                onPrint={handlePrintReceipt}
            />
        </div>
    );
}
