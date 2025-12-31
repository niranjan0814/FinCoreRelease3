import { User, Permission, Role, Staff } from '../types/staff.types';
import { API_BASE_URL, getHeaders } from './api.config';

export const staffService = {
    getUsers: async (type: 'admins' | 'staff' = 'admins'): Promise<User[]> => {
        try {
            const endpoint = type === 'admins' ? `${API_BASE_URL}/admins` : `${API_BASE_URL}/users`;
            const response = await fetch(endpoint, { headers: getHeaders() });

            if (!response.ok) return [];

            const data = await response.json();

            // Safety check for null/undefined data
            let items = [];
            if (data?.data?.items && Array.isArray(data.data.items)) {
                items = data.data.items;
            } else if (data?.data && Array.isArray(data.data)) {
                items = data.data;
            } else if (data?.data?.data && Array.isArray(data.data.data)) {
                items = data.data.data;
            } else if (Array.isArray(data)) {
                items = data;
            }

            return items.map((u: any) => ({
                id: u.id,
                name: u.full_name || u.user_name || u.name || u.email,
                staffId: u.user_name && /^ST\d+/.test(u.user_name) ? u.user_name : undefined,
                email: u.email,
                role: (u.roles && u.roles.length > 0) ? (u.roles[0].display_name || u.roles[0].name) : (u.role || 'N/A'),
                branch: u.branch?.name || (u.branch_id ? 'Branch ' + u.branch_id : '-'),
                branchId: u.branch_id || null,
                status: (u.is_active || u.status === 'Active' || u.status === 1) ? 'Active' : 'Inactive',
                is_locked: u.is_locked || false,
                locked_until: u.locked_until || null,
                today_session: u.today_session || null
            }));
        } catch (error) {
            console.error("Error fetching users", error);
            return [];
        }
    },

    getStaffList: async (): Promise<Staff[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/staffs`, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error fetching staff list", error);
            return [];
        }
    },

    getStaffDropdownList: async (): Promise<Staff[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/staffs/list`, { headers: getHeaders() });
            if (!response.ok) return [];

            const json = await response.json();
            return json.data || [];
        } catch (error) {
            console.error("Error fetching staff dropdown list", error);
            return [];
        }
    },

    getWitnessCandidates: async (): Promise<Staff[]> => {
        try {
            // Try fetching by role to avoid permission issues with full list
            const roles = ['manager', 'field_officer', 'staff'];
            const promises = roles.map(role =>
                fetch(`${API_BASE_URL}/staffs/by-role/${role}`, { headers: getHeaders() })
                    .then(r => r.ok ? r.json() : { data: [] })
                    .catch(() => ({ data: [] }))
            );

            const results = await Promise.all(promises);

            // Flatten and verify uniqueness by staff_id
            const allStaff: Staff[] = [];
            const seenIds = new Set<string>();

            results.forEach(res => {
                if (res.data && Array.isArray(res.data)) {
                    res.data.forEach((s: any) => {
                        if (s.staff_id && !seenIds.has(s.staff_id)) {
                            seenIds.add(s.staff_id);
                            allStaff.push({
                                staff_id: s.staff_id,
                                full_name: s.full_name || s.name,
                                email_id: s.email_id || '',
                            });
                        }
                    });
                }
            });

            return allStaff;
        } catch (error) {
            console.error("Error fetching witness candidates", error);
            return [];
        }
    },

    // getRoles: async (): Promise<Role[]> => {
    //     try {
    //         const response = await fetch(`${API_BASE_URL}/roles`, { headers: getHeaders() });

    //         if (!response.ok) {
    //             console.error(`Status: ${response.status}`);
    //             return [];
    //         }

    //         const data = await response.json();
    //         console.log('Roles API Response:', data); // Debug log

    //         if (!data) return [];

    //         // Handle BaseController.paginated format: { success: true, data: { items: [...], pagination: {...} } }
    //         if (data.data && data.data.items && Array.isArray(data.data.items)) {
    //             return data.data.items;
    //         }

    //         // Handle standard list format: { success: true, data: [...] }
    //         if (data.data && Array.isArray(data.data)) {
    //             return data.data;
    //         }

    //         // Handle standard pagination format: { success: true, data: { data: [...] } }
    //         if (data.data?.data && Array.isArray(data.data.data)) {
    //             return data.data.data;
    //         }

    //         console.warn('Roles data structure not recognized', data);
    //         return [];
    //     } catch (error) {
    //         console.error("Error fetching roles", error);
    //         return [];
    //     }
    // },

    getPermissions: async (): Promise<Permission[]> => {
        return [
            { module: 'Dashboard', view: true, create: true, edit: true, delete: false },
            { module: 'Customers', view: true, create: true, edit: true, delete: false },
            { module: 'Loans', view: true, create: true, edit: true, delete: false },
            { module: 'Collections', view: true, create: true, edit: false, delete: false },
            { module: 'Reports', view: true, create: false, edit: false, delete: false },
            { module: 'Finance', view: true, create: true, edit: true, delete: true },
            { module: 'Shareholders', view: true, create: true, edit: true, delete: true },
            { module: 'System Config', view: true, create: true, edit: true, delete: true }
        ];
    },

    createAdmin: async (userData: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/admins`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to create admin');
            throw new Error(msg);
        }
        return data;
    },

    createUser: async (userData: any): Promise<any> => {
        const role = userData.role?.toLowerCase() || '';

        if (role.includes('admin') || role === 'super_admin') {
            return staffService.createAdmin(userData);
        }

        // For other roles (Manager, Staff, Field Officer, etc.) use the Staff API to create in both tables
        if (userData.staffDetails) {
            const response = await fetch(`${API_BASE_URL}/staffs`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userData.staffDetails)
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.errors
                    ? Object.values(data.errors).flat().join(', ')
                    : (data.message || 'Failed to create staff');
                throw new Error(msg);
            }
            return data;
        }

        // Fallback for legacy calls (should not happen with new form)
        const payload = {
            user_name: userData.name ? userData.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000) : userData.email.split('@')[0],
            email: userData.email,
            password: userData.password,
            password_confirmation: userData.password,
            is_active: true,
            roles: [parseInt(userData.roleId)]
        };

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || `Failed to create ${role}`);
            throw new Error(msg);
        }
        return data;
    },
    getAllRoles: async (): Promise<Role[]> => {
        const response = await fetch(`${API_BASE_URL}/roles/all`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            console.error(`Error fetching roles: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    },


    updateUser: async (id: number | string, userData: any): Promise<any> => {
        const role = userData.role?.toLowerCase() || '';

        // Handle Staff Update (Manager, Field Officer, etc.)
        if (userData.staffDetails && userData.staffId) {
            const response = await fetch(`${API_BASE_URL}/staffs/${userData.staffId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(userData.staffDetails)
            });

            const data = await response.json();

            if (!response.ok) {
                const msg = data.errors
                    ? Object.values(data.errors).flat().join(', ')
                    : (data.message || 'Failed to update staff');
                throw new Error(msg);
            }
            return data;
        }

        // Standard Admin/User update
        const endpoint = (role.includes('admin') || role.includes('super'))
            ? `${API_BASE_URL}/admins/${id}`
            : `${API_BASE_URL}/users/${id}`;

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors
                ? Object.values(data.errors).flat().join(', ')
                : (data.message || 'Failed to update user');
            throw new Error(msg);
        }
        return data;
    },

    getStaffDetails: async (staffId: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/staffs/${staffId}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            // It might be 404 if it's an admin or not found, but let's handle gracefullly
            return null;
        }

        const data = await response.json();
        return data.data;
    },

    deleteUser: async (id: number | string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'Failed to delete user');
        }
    }
};
