"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Filter, Upload } from 'lucide-react';
import { Customer, CustomerStats } from '../../types/customer.types';
import { customerService } from '../../services/customer.service';
import { CustomerStatsCard } from '../../components/customers/CustomerStats';
import { CustomerTable } from '../../components/customers/CustomerTable';
import { CustomerDetailsModal } from '../../components/customers/CustomerDetailsModal';
import { CustomerForm } from '../../components/customers/CustomerForm';
import { CustomerProfilePanel } from '../../components/customers/CustomerProfilePanel';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState<'All' | 'Male' | 'Female'>('All');
    const [loading, setLoading] = useState(true);

    // Confirmation States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingAction, setPendingAction] = useState<{
        customer: Customer | null;
        newStatus?: string;
    }>({ customer: null });

    const router = useRouter();

    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAccess = () => {
            const hasViewPermission = authService.hasPermission('customers.view');
            const isSuperAdmin = authService.hasRole('super_admin');

            if (!hasViewPermission && !isSuperAdmin) {
                toast.error('You do not have permission to view customers');
                router.push('/');
                return false;
            }
            return true;
        };

        if (typeof window !== 'undefined') {
            const allowed = checkAccess();
            setHasAccess(allowed);
            if (allowed) loadCustomers();
        }
    }, [router]);

    // Stats
    const [stats, setStats] = useState<CustomerStats>({
        totalCustomers: 0,
        activeCustomers: 0,
        customersWithLoans: 0,
        newThisMonth: 0
    });

    useEffect(() => {
        applyFilters();
    }, [customers, searchTerm, filterGender]);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await customerService.getCustomers();
            setCustomers(data);

            // Calculate stats (placeholder logic - adjust based on your data)
            setStats({
                totalCustomers: data.length,
                activeCustomers: data.length, // Assuming all are active
                customersWithLoans: 0, // Would need loan data
                newThisMonth: 0 // Would need created_at filtering
            });
        } catch (error) {
            console.error('Failed to load customers', error);
            toast.error('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = customers;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(customer =>
                customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.mobile_no_1.includes(searchTerm)
            );
        }

        // Gender filter
        if (filterGender !== 'All') {
            filtered = filtered.filter(customer => customer.gender === filterGender);
        }

        setFilteredCustomers(filtered);
    };

    const handleViewDetails = (customer: Customer) => {
        if (selectedCustomer?.id === customer.id) {
            setSelectedCustomer(null);
        } else {
            setSelectedCustomer(customer);
        }
    };


    const handleViewFullDetails = () => {
        setShowDetailsModal(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
    };

    const handleDelete = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setPendingAction({ customer: customer || null });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!pendingAction.customer) return;
        try {
            await customerService.deleteCustomer(pendingAction.customer.id);
            toast.success('Customer deleted successfully');
            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete customer');
        } finally {
            setShowDeleteConfirm(false);
            setPendingAction({ customer: null });
        }
    };

    const handleStatusChange = (customer: Customer, newStatus: string) => {
        setPendingAction({ customer, newStatus });
        setShowStatusConfirm(true);
    };

    const confirmStatusChange = async () => {
        if (!pendingAction.customer || !pendingAction.newStatus) return;
        const { customer, newStatus } = pendingAction;

        try {
            await customerService.updateCustomer(customer.id, { status: newStatus as any });
            toast.success(`Customer ${newStatus === 'blocked' ? 'disabled' : 'enabled'} successfully`);
            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || `Failed to update customer status`);
        } finally {
            setShowStatusConfirm(false);
            setPendingAction({ customer: null });
        }
    };

    const handleSaveCustomer = async (data: any) => {
        if (selectedCustomer) {
            // Update
            return await customerService.updateCustomer(selectedCustomer.id, data);
        } else {
            // Create
            return await customerService.createCustomer(data);
        }
    };

    const handleFormClose = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedCustomer(null);
        loadCustomers();
    };

    const handleExport = async () => {
        try {
            await customerService.exportCustomers();
            toast.success('Customers exported successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to export customers');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setImporting(true);
        try {
            await customerService.importCustomers(file);
            toast.success('Customers imported successfully');
            loadCustomers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to import customers');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (hasAccess === false) return null;

    if (hasAccess === null) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Verifying permissions...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer List</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all customer information</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".csv"
                        className="hidden"
                    />
                    {authService.hasPermission('customers.view') && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium text-sm disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
                        </button>
                    )}
                    {authService.hasPermission('customers.view') && (
                        <button
                            onClick={handleExport}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium text-sm"
                        >
                            <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span>Export CSV</span>
                        </button>
                    )}
                    {authService.hasPermission('customers.create') && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Customer</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics */}
            <CustomerStatsCard stats={stats} />

            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search customers by name, NIC, or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3 bg-gray-50 dark:bg-gray-700 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <select
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value as 'All' | 'Male' | 'Female')}
                                className="bg-transparent border-none text-sm py-2.5 focus:outline-none text-gray-700 dark:text-gray-200"
                            >
                                <option value="All">All Genders</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Customer Table */}
                <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading customers...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">No customers found</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            >
                                Add your first customer
                            </button>
                        </div>
                    ) : (
                        <CustomerTable
                            customers={filteredCustomers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            onViewDetails={handleViewDetails}
                            selectedCustomer={selectedCustomer}
                        />
                    )}
                </div>

                {/* Side Panel */}
                {selectedCustomer && (
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        <CustomerProfilePanel
                            customer={selectedCustomer}
                            onClose={() => setSelectedCustomer(null)}
                            onEdit={handleEdit}
                            onViewFullDetails={handleViewFullDetails}
                            onStatusChange={handleStatusChange}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            {showDetailsModal && selectedCustomer && (
                <CustomerDetailsModal
                    customer={selectedCustomer}
                    onClose={() => {
                        setShowDetailsModal(false);
                        // Do NOT clear selectedCustomer, so panel stays open? 
                        // Or if panel is open, modal is overlay? 
                        // If modal closes, panel should remain? 
                        // Yes.
                    }}
                />
            )}

            {showAddModal && (
                <CustomerForm
                    onClose={handleFormClose}
                    onSubmit={handleSaveCustomer}
                />
            )}

            {showEditModal && selectedCustomer && (
                <CustomerForm
                    onClose={handleFormClose}
                    onSubmit={handleSaveCustomer}
                    initialData={selectedCustomer}
                />
            )}

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Customer Profile"
                message={`Are you sure you want to permanently delete ${pendingAction.customer?.full_name}'s profile? This action cannot be undone.`}
                confirmText="Permanently Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />

            <ConfirmDialog
                isOpen={showStatusConfirm}
                title={pendingAction.newStatus === 'blocked' ? 'Disable Customer' : 'Activate Customer'}
                message={`Are you sure you want to ${pendingAction.newStatus === 'blocked' ? 'disable' : 'enable'} ${pendingAction.customer?.full_name}? ${pendingAction.newStatus === 'blocked' ? 'They will no longer be eligible for new transactions.' : 'They will be able to perform transactions again.'}`}
                confirmText={pendingAction.newStatus === 'blocked' ? 'Yes, Disable' : 'Yes, Activate'}
                cancelText="Cancel"
                variant={pendingAction.newStatus === 'blocked' ? 'warning' : 'info'}
                onConfirm={confirmStatusChange}
                onCancel={() => setShowStatusConfirm(false)}
            />
        </div>
    );
}
