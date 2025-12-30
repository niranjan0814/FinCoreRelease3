'use client';

import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Search, Edit2, Trash2 } from 'lucide-react';
import { InvestmentProduct, InvestmentProductFormData } from '../../types/investment-product.types';
import { investmentProductService } from '../../services/investment-product.service';
import { InvestmentProductForm } from '../../components/investment-product/InvestmentProductForm';
import { toast, ToastContainer } from 'react-toastify';

export default function InvestmentManagementPage() {
    const [products, setProducts] = useState<InvestmentProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<InvestmentProduct | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await investmentProductService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: InvestmentProductFormData) => {
        try {
            if (editingProduct) {
                await investmentProductService.updateProduct(editingProduct.id, data);
                toast.success('Product updated');
            } else {
                await investmentProductService.createProduct(data);
                toast.success('Product created');
            }
            setShowModal(false);
            loadProducts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await investmentProductService.deleteProduct(id);
            toast.success('Product deleted');
            loadProducts();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Investment Products</h1>
                    <p className="text-sm text-gray-500">Manage investment schemes</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Interest Rate</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Min Age</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium">{p.name}</td>
                                <td className="px-6 py-4">{Number(p.interest_rate)}%</td>
                                <td className="px-6 py-4">{p.age_limited}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => { setEditingProduct(p); setShowModal(true); }} className="text-blue-600"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <InvestmentProductForm
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                initialData={editingProduct}
            />
            <ToastContainer />
        </div>
    );
}
