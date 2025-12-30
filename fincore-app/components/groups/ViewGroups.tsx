'use client'

import React, { useState, useEffect } from 'react';
import { Search, Plus, UsersRound, Users, TrendingUp, UserPlus } from 'lucide-react';
import { Group, GroupFormData } from '../../types/group.types';
import { GroupForm } from './GroupForm';
import { GroupTable } from './GroupTable';
import { GroupMemberModal } from './GroupMemberModal';
import { groupService } from '../../services/group.service';
import { toast } from 'react-toastify';

export function ViewGroups() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch groups on mount
    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            setIsLoading(true);
            const data = await groupService.getGroups();
            setGroups(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load groups:', err);
            setError(err.message || 'Failed to load groups. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroup = async (groupData: GroupFormData) => {
        try {
            const newGroup = await groupService.createGroup(groupData);
            setGroups([...groups, newGroup]);
            setIsCreateModalOpen(false);
            toast.success('Group created successfully!');
        } catch (err: any) {
            console.error('Failed to create group:', err);
            const errorMessage = err.errors ?
                Object.values(err.errors).flat().join(', ') :
                err.message || 'Failed to create group';
            toast.error(errorMessage);
        }
    };

    const handleUpdateGroup = async (groupData: GroupFormData) => {
        if (!selectedGroup) return;

        try {
            const updatedGroup = await groupService.updateGroup(selectedGroup.id, groupData);
            setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));
            setIsCreateModalOpen(false);
            setSelectedGroup(null);
            toast.success('Group updated successfully!');
        } catch (err: any) {
            console.error('Failed to update group:', err);
            const errorMessage = err.errors ?
                Object.values(err.errors).flat().join(', ') :
                err.message || 'Failed to update group';
            toast.error(errorMessage);
        }
    };

    const handleDeleteGroup = async (groupId: number) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;

        try {
            await groupService.deleteGroup(groupId);
            setGroups(groups.filter(g => g.id !== groupId));
            toast.success('Group deleted successfully!');
        } catch (err: any) {
            console.error('Failed to delete group:', err);
            toast.error(err.message || 'Failed to delete group');
        }
    };

    const handleEdit = (group: Group) => {
        setSelectedGroup(group);
        setIsCreateModalOpen(true);
    };

    const handleViewMembers = (group: Group) => {
        setSelectedGroup(group);
        setIsMemberModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedGroup(null);
        setIsCreateModalOpen(true);
    };

    const filteredGroups = groups.filter(group =>
        group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.group_code && group.group_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (group.center?.center_name && group.center.center_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate statistics
    const totalGroups = groups.length;
    const activeGroups = groups.filter(g => g.status === 'active').length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || g.customers?.length || g.members?.length || 0), 0);
    const avgMembersPerGroup = totalGroups > 0 ? Math.round(totalMembers / totalGroups) : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
                <p>{error}</p>
                <button
                    onClick={loadGroups}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage self-help groups and their members</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Group</span>
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UsersRound className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Groups</p>
                    <p className="text-2xl font-bold text-gray-900">{totalGroups}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        {totalGroups > 0 && (
                            <span className="text-xs font-medium text-gray-600">
                                {((activeGroups / totalGroups) * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Active Groups</p>
                    <p className="text-2xl font-bold text-gray-900">{activeGroups}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Avg Members/Group</p>
                    <p className="text-2xl font-bold text-gray-900">{avgMembersPerGroup}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search groups by name, code, or center..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Groups Table */}
            <GroupTable
                groups={filteredGroups}
                totalGroups={totalGroups}
                onEdit={handleEdit}
                onViewMembers={handleViewMembers}
                onDelete={handleDeleteGroup}
            />

            {filteredGroups.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <UsersRound className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
                    <p className="text-gray-500">Try adjusting your search or create a new group.</p>
                </div>
            )}

            {/* Group Form Modal */}
            <GroupForm
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedGroup(null);
                }}
                onSubmit={selectedGroup ? handleUpdateGroup : handleCreateGroup}
                initialData={selectedGroup ? {
                    id: selectedGroup.id,
                    group_name: selectedGroup.group_name,
                    center_id: selectedGroup.center_id,
                    branch_id: selectedGroup.branch_id,
                    status: selectedGroup.status,
                    customer_ids: selectedGroup.customers?.map(c => c.id.toString())
                } : null}
            />

            {/* Members Modal */}
            <GroupMemberModal
                isOpen={isMemberModalOpen}
                onClose={() => {
                    setIsMemberModalOpen(false);
                    setSelectedGroup(null);
                }}
                group={selectedGroup}
            />
        </div>
    );
}
