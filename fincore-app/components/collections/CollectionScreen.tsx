'use client'

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { CollectionStats } from './CollectionStats';
import { CollectionFilters } from './CollectionFilters';
import { ScheduledPaymentsTable } from './ScheduledPaymentsTable';
import { PaymentModal } from './PaymentModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { PaymentHistoryModal } from './PaymentHistoryModal';
import { ScheduledPayment, CollectionStats as StatsType } from '../../services/collection.types';
import { collectionService } from '../../services/collection.service';
import { branchService } from '../../services/branch.service';
import { centerService } from '../../services/center.service';
import { toast } from 'react-toastify';

export function CollectionScreen() {
    const [branches, setBranches] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCenter, setSelectedCenter] = useState('');
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
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<ScheduledPayment | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchService.getBranchesAll();
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

    // Fetch centers when branch changes
    useEffect(() => {
        if (!selectedBranch) {
            setCenters([]);
            setSelectedCenter('');
            return;
        }

        const fetchCenters = async () => {
            try {
                const response = await centerService.getCenters();
                const allCenters = Array.isArray(response) ? response : (response as any).data || [];

                // Filter centers by selected branch and active status
                const filtered = allCenters.filter((c: any) =>
                    String(c.branch_id) === selectedBranch && c.status === 'active'
                );

                setCenters(filtered);
            } catch (error) {
                console.error('Failed to fetch centers', error);
                toast.error('Failed to load centers');
            }
        };

        fetchCenters();
    }, [selectedBranch]);

    // Fetch payments when branch, center, or date changes
    useEffect(() => {
        if (!selectedBranch) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await collectionService.getDuePayments(
                    selectedBranch,
                    selectedCenter || undefined,
                    selectedDate
                );
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
    }, [selectedBranch, selectedCenter, selectedDate]);

    const handleCollectPayment = (customer: ScheduledPayment) => {
        setSelectedCustomer(customer);
        setShowPaymentModal(true);
    };

    const handleShowHistory = (customer: ScheduledPayment) => {
        setSelectedCustomer(customer);
        setShowHistoryModal(true);
    };

    const handlePrintHistoryReceipt = async (payment: any) => {
        if (!payment.receipt) return;
        try {
            // We need full receipt details including branch, center, etc.
            // Let's assume we can fetch it or we already have enough in receiptData state if we update it.
            // For now, let's just trigger the preview modal with what we have.
            setReceiptData({
                payment: payment,
                receipt: payment.receipt,
                // We'll need to make sure the preview modal can handle missing branch/staff info or fetch it.
            });
            setShowReceiptPreview(true);
        } catch (error) {
            toast.error("Failed to prepare receipt for printing");
        }
    };

    const handleProcessPayment = async (amount: string, type: 'full' | 'partial', method: string, remarks: string) => {
        if (!selectedCustomer) return;

        try {
            const paymentData = {
                loan_id: selectedCustomer.id,
                amount: parseFloat(amount),
                payment_date: selectedDate,
                receipt_number: `RCP-${Date.now()}-${selectedCustomer.id}`
            };

            const result = await collectionService.collectPayment(paymentData);

            toast.success('Payment collected successfully!');
            setReceiptData(result);
            setShowPaymentModal(false);
            setShowReceiptPreview(true);

            // Refresh payment list
            const data = await collectionService.getDuePayments(
                selectedBranch,
                selectedCenter || undefined,
                selectedDate
            );
            setPayments(data.payments);
            setStats(data.stats);

        } catch (error: any) {
            console.error('Failed to collect payment', error);
            toast.error(error.message || 'Failed to collect payment');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
        setShowReceiptPreview(false);
        setReceiptData(null);
    };

    const handleExportSummary = async () => {
        if (!selectedBranch) return;
        try {
            await collectionService.exportCollections(
                selectedBranch,
                selectedCenter || undefined,
                selectedDate
            );
            toast.success('Collection summary exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export collection summary');
        }
    };

    const getCenterName = () => {
        if (!selectedCenter) {
            const branch = branches.find(b => String(b.id) === selectedBranch);
            return branch ? branch.branch_name : '';
        }
        const center = centers.find(c => String(c.id) === selectedCenter);
        return center ? center.center_name : '';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collection Screen</h1>
                    <p className="text-sm text-gray-500 mt-1">Collect payments and generate receipts</p>
                </div>
                {selectedBranch && (
                    <button
                        onClick={handleExportSummary}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">Export Summary</span>
                    </button>
                )}
            </div>

            {/* Filter Section */}
            <CollectionFilters
                branches={branches}
                centers={centers}
                selectedBranch={selectedBranch}
                selectedCenter={selectedCenter}
                onBranchChange={(branchId) => {
                    setSelectedBranch(branchId);
                    setSelectedCenter('');
                }}
                onCenterChange={setSelectedCenter}
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
                            selectedCenter={getCenterName()}
                            onCollectPayment={handleCollectPayment}
                            onShowHistory={handleShowHistory}
                            selectedDate={selectedDate}
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

            {/* Payment History Modal */}
            <PaymentHistoryModal
                isOpen={showHistoryModal}
                customer={selectedCustomer}
                onClose={() => setShowHistoryModal(false)}
                onPrintReceipt={handlePrintHistoryReceipt}
            />

            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                isOpen={showReceiptPreview}
                customer={selectedCustomer}
                paymentAmount={receiptData?.payment?.last_payment_amount?.toString() || '0'}
                receiptData={receiptData}
                onClose={() => {
                    setShowReceiptPreview(false);
                    setReceiptData(null);
                }}
                onPrint={handlePrintReceipt}
            />
        </div>
    );
}
