'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Shareholder, NewShareholder } from '@/types/shareholder.types';
import { ShareholderStats } from './ShareholderStats';
import { ShareholderTable } from './ShareholderTable';
import { AddShareholderModal } from './AddShareholderModal';
import { ShareholderDetailsModal } from './ShareholderDetailsModal';
import { ProfitDistribution } from './ProfitDistribution';
import { shareholderService } from '@/services/shareholder.service';
import { toast } from 'react-toastify';

export function ShareholderModule() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedShareholder, setSelectedShareholder] = useState<Shareholder | null>(null);
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newShareholder, setNewShareholder] = useState<NewShareholder>({
        name: '',
        shares: '',
        totalInvestment: '',
        percentage: '',
        nic: '',
        contact: '',
        address: ''
    });

    const fetchShareholders = async () => {
        try {
            setIsLoading(true);
            const data = await shareholderService.getAll();
            setShareholders(data);
        } catch (error: any) {
            console.error('Error fetching shareholders:', error);
            toast.error(error.message || 'Failed to fetch shareholders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShareholders();
    }, []);

    const handleAddShareholder = async () => {
        if (
            !newShareholder.name ||
            !newShareholder.shares ||
            !newShareholder.totalInvestment ||
            !newShareholder.percentage
        ) {
            toast.warning('Please fill in all required fields');
            return;
        }

        try {
            const payload = {
                name: newShareholder.name,
                shares: Number(newShareholder.shares),
                total_investment: Number(newShareholder.totalInvestment),
                percentage: Number(newShareholder.percentage),
                nic: newShareholder.nic || undefined,
                contact: newShareholder.contact || undefined,
                address: newShareholder.address || undefined
            };

            await shareholderService.create(payload as any);
            toast.success('Shareholder added successfully');

            setNewShareholder({
                name: '',
                shares: '',
                totalInvestment: '',
                percentage: '',
                nic: '',
                contact: '',
                address: ''
            });
            setShowAddModal(false);
            fetchShareholders();
        } catch (error: any) {
            console.error('Error adding shareholder:', error);
            toast.error(error.message || 'Failed to add shareholder');
        }
    };

    const handleViewDetails = (shareholder: Shareholder) => {
        setSelectedShareholder(shareholder);
        setShowDetailsModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shareholder Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage shareholders and profit distribution</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Shareholder</span>
                </button>
            </div>

            <ShareholderStats shareholders={shareholders} />

            <ShareholderTable
                shareholders={shareholders}
                onViewDetails={handleViewDetails}
            />

            <ProfitDistribution />

            <AddShareholderModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                newShareholder={newShareholder}
                setNewShareholder={setNewShareholder}
                onAdd={handleAddShareholder}
            />

            <ShareholderDetailsModal
                show={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                shareholder={selectedShareholder}
            />
        </div>
    );
}
