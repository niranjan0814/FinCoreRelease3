'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Settings, Edit, Loader2 } from 'lucide-react';
import { Privilege, Role, Permission, PermissionGroup } from '../../types/role.types';
import { PrivilegeListItem } from './PrivilegeListItem';
import { RoleListItem } from './RoleListItem';
import { PermissionsTable } from './PermissionsTable';
import { RoleModal } from './RoleModal';
import { PrivilegeModal } from './PrivilegeModal';
import { roleService } from '../../services/role.service';
import { toast } from 'react-toastify';

export function RolesPrivileges() {
    // Data States
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<any[]>([]);
    const [privileges, setPrivileges] = useState<Privilege[]>([]);
    const [matrixColumns, setMatrixColumns] = useState<Privilege[]>([]);
    const [modules, setModules] = useState<string[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [privModalOpen, setPrivModalOpen] = useState(false);
    const [editingPrivilege, setEditingPrivilege] = useState<Privilege | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedRoles, fetchedPerms, fetchedGroups] = await Promise.all([
                roleService.getRoles(),
                roleService.getAvailablePermissions(),
                roleService.getPermissionGroups()
            ]);

            setRoles(fetchedRoles);
            setAllPermissions(fetchedPerms);
            setPermissionGroups(fetchedGroups);

            // Dynamically determine modules and privileges (actions)
            const extractedModules = Array.from(new Set(fetchedPerms.map((p: any) => p.module || 'System'))).sort() as string[];
            setModules(extractedModules);

            const extractedActions = Array.from(new Set(fetchedPerms.map((p: any) => p.name.split('.').pop()))).sort() as string[];

            // Map backend permissions to UI Privileges for the dictionary
            const mappedPrivileges: Privilege[] = fetchedPerms.map((p: any) => ({
                id: p.id.toString(),
                name: p.name,
                display_name: p.display_name || p.name,
                description: p.description || `Permission for ${p.name}`,
                module: p.module,
                permission_group_id: p.permission_group_id,
                is_core: p.is_core,
                group: fetchedGroups.find(g => g.id === p.permission_group_id)
            }));
            setPrivileges(mappedPrivileges);

            // Use the simple actions for the Matrix columns
            const matrixCols: Privilege[] = extractedActions.map((action, idx) => ({
                id: `action-${idx}`,
                name: action,
                description: `Permission to ${action}`
            }));
            setMatrixColumns(matrixCols);

            // Update selected role if it exists
            if (selectedRole) {
                const refreshed = fetchedRoles.find(r => r.id === selectedRole.id);
                if (refreshed) setSelectedRole(refreshed);
            } else if (fetchedRoles.length > 0) {
                setSelectedRole(fetchedRoles[0]);
            }

        } catch (error) {
            console.error("Failed to load roles/permissions", error);
            toast.error("Failed to connect to security server");
        } finally {
            setLoading(false);
        }
    }, [selectedRole]);

    useEffect(() => {
        loadData();
    }, []); // Run once on mount

    // Handlers - Roles
    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setRoleModalOpen(true);
    };

    const handleSaveRole = async (roleData: Partial<Role>) => {
        try {
            // roleData.permissions contains the matrix format from RoleModal
            // The service will convert it to permission_matrix format for the backend

            if (editingRole) {
                await roleService.updateRole(editingRole.id, roleData);
                toast.success("Role updated successfully");
            } else {
                await roleService.createRole(roleData);
                toast.success("New role created");
            }
            await loadData();
            setRoleModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to save role");
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Are you sure you want to delete this role permanently?')) return;
        try {
            await roleService.deleteRole(id);
            toast.success("Role removed");
            await loadData();
        } catch (error: any) {
            toast.error(error.message || "Deletion failed");
        }
    };

    // Handlers - Privileges
    const handleSavePrivilege = async (privilegeData: Partial<Privilege>) => {
        try {
            if (privilegeData.name) {
                await roleService.createPermission({
                    name: privilegeData.name,
                    description: privilegeData.description || ''
                });
                toast.success("Permission created successfully");
                await loadData(); // Reload to see the new permission in the list
                setPrivModalOpen(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create permission");
        }
    };

    const handleCreatePrivilege = () => {
        setEditingPrivilege(null);
        setPrivModalOpen(true);
    };

    const [showSidebar, setShowSidebar] = useState(true);

    if (loading && roles.length === 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Synchronizing Guard Data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
            {/* Optimized Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-800 px-10 py-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        Security Management
                        {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium opacity-80 uppercase tracking-widest">Configure access roles and system-wide privileges</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`hidden xl:flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${showSidebar
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                    >
                        {showSidebar ? 'Maximize Matrix' : 'Show Sidebar'}
                    </button>
                    <button
                        onClick={handleCreatePrivilege}
                        className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-500/20 transition-all active:scale-95"
                    >
                        <Settings size={18} />
                        New Permission
                    </button>
                    <button
                        onClick={handleCreateRole}
                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        New Role
                    </button>
                </div>
            </div>

            {/* Main Application Interface */}
            <div className="flex flex-col xl:flex-row gap-8 items-start h-full pb-10">

                {/* Unified Sidebar: Privileges & Roles */}
                <div className={`xl:w-[450px] w-full space-y-8 h-full transition-all duration-500 ease-in-out ${!showSidebar ? 'xl:-ml-[480px] xl:opacity-0 pointer-events-none' : 'opacity-100'}`}>

                    {/* Access Roles Section */}
                    <div className="bg-white/70 dark:bg-gray-800/70 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Access Roles</h3>
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-black">{roles.length} Active</span>
                        </div>
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {roles.map(role => (
                                <RoleListItem
                                    key={role.id}
                                    role={role}
                                    isActive={selectedRole?.id === role.id}
                                    onClick={() => setSelectedRole(role)}
                                    onEdit={handleEditRole}
                                    onDelete={handleDeleteRole}
                                />
                            ))}
                        </div>
                    </div>

                    {/* System Privileges Section */}
                    <div className="bg-white/50 dark:bg-gray-800/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Capability Dictionary</h3>
                            <span className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full font-black">{privileges.length} Permissions</span>
                        </div>
                        <div className="space-y-8 max-h-[400px] overflow-y-auto pr-3 scrollbar-init scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {permissionGroups.map(group => {
                                const groupPrivs = privileges.filter(p => p.permission_group_id === group.id);
                                if (groupPrivs.length === 0) return null;

                                return (
                                    <div key={group.id} className="space-y-4">
                                        <div className="flex items-center gap-2 px-2">
                                            <div className="w-1.5 h-4 rounded-full bg-blue-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                                                {group.name}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {groupPrivs.map(priv => (
                                                <PrivilegeListItem
                                                    key={priv.id}
                                                    privilege={priv}
                                                    onEdit={() => toast.info('Privilege details are managed via permission seeds')}
                                                    onDelete={() => { }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Uncategorized permissions */}
                            {privileges.some(p => !p.permission_group_id) && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="w-1.5 h-4 rounded-full bg-gray-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            Others
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {privileges.filter(p => !p.permission_group_id).map(priv => (
                                            <PrivilegeListItem
                                                key={priv.id}
                                                privilege={priv}
                                                onEdit={() => toast.info('Privilege details are managed via permission seeds')}
                                                onDelete={() => { }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area: Matrix View */}
                <div className="flex-1 w-full min-w-0 h-full transition-all duration-500">
                    {selectedRole ? (
                        <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/10 dark:shadow-none animate-in zoom-in-95 duration-500 h-full overflow-hidden flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Shield size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
                                                    {selectedRole.display_name || selectedRole.name}
                                                </h2>
                                                {selectedRole.is_system && (
                                                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-amber-500/20">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${selectedRole.level === 'super_admin' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                    selectedRole.level === 'admin' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                        selectedRole.level === 'manager' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                            'bg-gray-50 text-gray-700 ring-gray-600/20'
                                                    }`}>
                                                    {selectedRole.level?.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                    Hierarchy: {selectedRole.hierarchy}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
                                        {selectedRole.description || 'Define specific module-level access and capability controls for this role.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleEditRole(selectedRole)}
                                        className="flex items-center gap-2 px-8 py-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-gray-100 dark:border-gray-700"
                                    >
                                        <Edit size={16} />
                                        Modify Matrix
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                                <PermissionsTable
                                    permissions={selectedRole.permissions}
                                    availablePrivileges={matrixColumns}
                                    readOnly={true}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700/50">
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Shield size={64} className="text-blue-500/10" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Security Matrix Interface</h3>
                            <p className="text-sm text-gray-500 font-medium mt-3 max-w-xs text-center leading-relaxed">Select an access role from the structural directory to view and configure its capability matrix.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <RoleModal
                isOpen={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                onSave={handleSaveRole}
                editingRole={editingRole}
                privileges={matrixColumns}
                defaultModules={modules}
                existingRoles={roles}
            />

            <PrivilegeModal
                isOpen={privModalOpen}
                onClose={() => setPrivModalOpen(false)}
                onSave={handleSavePrivilege}
                editingPrivilege={editingPrivilege}
            />
        </div>
    );
}
