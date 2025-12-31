"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Branch, BranchStats as BranchStatsType, BranchFormData } from '../../types/branch.types';
import { branchService } from '../../services/branch.service';
import { BranchStats } from '../../components/branches/BranchStats';
import { BranchTable } from '../../components/branches/BranchTable';
import { BranchForm } from '../../components/branches/BranchForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { colors } from '../../themes/colors';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState<number | null>(null);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const router = useRouter();

    // Initial data fetch and security check
    useEffect(() => {
        const checkAccess = () => {
            const hasViewPermission = authService.hasPermission('branches.view');
            const isSuperAdmin = authService.hasRole('super_admin');

            if (!hasViewPermission && !isSuperAdmin) {
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
            if (allowed) loadBranches();
        }
    }, [router]);

    const loadBranches = async () => {
        try {
            setLoading(true);
            const data = await branchService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Failed to load branches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingBranch(null);
        setShowModal(true);
    };

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        setBranchToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (branchToDelete === null) return;

        try {
            await branchService.deleteBranch(branchToDelete);
            await loadBranches();
            toast.success('Branch deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete branch:', error);
            const errorMessage = error.message || 'Failed to delete branch. It may be in use.';
            toast.error(errorMessage);
        } finally {
            setBranchToDelete(null);
        }
    };

    const handleSave = async (formData: BranchFormData) => {
        try {
            if (editingBranch) {
                await branchService.updateBranch(editingBranch.id, formData);
                toast.success('Branch updated successfully!');
            } else {
                await branchService.createBranch(formData);
                toast.success('Branch created successfully!');
            }
            setShowModal(false);
            loadBranches();
        } catch (error: any) {
            console.error('Failed to save branch:', error);
            const errorMessage = error.errors ?
                Object.values(error.errors).flat().join(', ') :
                error.message || 'Failed to save branch';
            toast.error(errorMessage);
        }
    };

    // Filter branches based on search
    const filteredBranches = branches.filter(branch =>
        (branch.branch_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.branch_id ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.location ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate statistics
    const stats: BranchStatsType = {
        totalBranches: branches.length,
        // Backend doesn't support status yet, so we assume all are active or count if we added the optional field
        activeBranches: branches.length,
        totalCustomers: 0, // Not supported by backend yet
        totalLoans: 0 // Not supported by backend yet
    };

    if (hasAccess === false) return null;

    if ((loading && branches.length === 0) || hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all branch locations and details</p>
                </div>
                <div className="flex gap-2">
                    {/* <button
                        onClick={async () => {
                            try {
                                const res = await fetch('http://localhost:8000/api/auth/login', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ login: 'admin@fincore.com', password: 'S@1234admin' })
                                });
                                const data = await res.json();
                                if (data.data?.access_token) {
                                    localStorage.setItem('token', data.data.access_token);
                                    toast.success('Logged in as Admin! Token saved.');
                                    loadBranches();
                                } else {
                                    toast.error('Login failed: ' + JSON.stringify(data));
                                }
                            } catch (e) {
                                toast.error('Login error: ' + e);
                            }
                        }}
                        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs"
                    >
                        DEBUG: Login as Admin
                    </button> */}
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        style={{ backgroundColor: colors.primary[600] }}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Branch</span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <BranchStats stats={stats} />

            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search branches by name, ID, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <BranchTable
                branches={filteredBranches}
                totalBranches={branches.length}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Branch Form Modal */}
            <BranchForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingBranch}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Branch"
                message="Are you sure you want to delete this branch? This action cannot be undone and may affect related centers and groups."
                confirmText="Delete Branch"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false);
                    setBranchToDelete(null);
                }}
            />

            {/* Detail components */}
        </div>
    );
}
