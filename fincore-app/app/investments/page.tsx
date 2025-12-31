'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, UserCheck, ShieldAlert } from 'lucide-react';
import { InvestmentProduct, InvestmentProductFormData } from '../../types/investment-product.types';
import { investmentProductService } from '../../services/investment-product.service';
import { InvestmentProductForm } from '../../components/investment-product/InvestmentProductForm';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';

export default function InvestmentManagementPage() {
    const [products, setProducts] = useState<InvestmentProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await investmentProductService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load investment products');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: InvestmentProductFormData) => {
        try {
            if (editingProduct) {
                await investmentProductService.updateProduct(editingProduct.id, data);
                toast.success('Product updated successfully');
            } else {
                await investmentProductService.createProduct(data);
                toast.success('Product created successfully');
            }
            setShowModal(false);
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save product');
        }
    };

    const handleDelete = (id: number) => {
        setProductToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (productToDelete === null) return;
        try {
            await investmentProductService.deleteProduct(productToDelete);
            toast.success('Product deleted successfully');
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete product');
        } finally {
            setShowDeleteConfirm(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Investment Schemes</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Configure and track investment product configurations</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create New Product</span>
                </button>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1 gap-6">
                {/* Search and Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by product name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-gray-700 dark:text-gray-300"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Information</th>
                                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interest Rate</th>
                                    <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Minimum Age</th>
                                    <th className="px-6 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-gray-500 font-medium">Loading products...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length > 0 ? (
                                    filteredProducts.map(p => (
                                        <tr key={p.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                                        <ShieldAlert className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                                    </div>
                                                    <div className="max-w-md">
                                                        <p className="font-bold text-gray-900 dark:text-gray-100 break-words line-clamp-2">{p.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-tighter font-semibold">Product ID: #{p.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-sm">
                                                    {Number(p.interest_rate)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <UserCheck className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {p.age_limited || 18}+ Years
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => { setEditingProduct(p); setShowModal(true); }}
                                                        className="p-2.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 className="w-4.5 h-4.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p.id)}
                                                        className="p-2.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-90"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-gray-400 dark:text-gray-500 font-medium">No investment products found matching your search</p>
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-sm text-blue-600 font-bold hover:underline"
                                                >
                                                    Clear search filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <InvestmentProductForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingProduct}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Deactivate Product Scheme"
                message="Are you sure you want to delete this investment product? This action will prevent new accounts from using this scheme, but will not affect existing active investments."
                confirmText="Permanently Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
}
