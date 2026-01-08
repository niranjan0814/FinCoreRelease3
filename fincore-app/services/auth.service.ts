import { API_BASE_URL, getHeaders } from './api.config';

export interface User {
    id: number;
    name: string;
    email: string;
    user_name: string;
    role: string;
    avatar?: string;
    avatar_url?: string;
    full_name?: string;
    display_name?: string;
    role_name?: string;
    staff_id?: string;
    phone?: string;
    address?: string;
    branch?: {
        id: number;
        name: string;
    };
    staff_detail?: {
        phone?: string;
        address?: string;
        designation?: string;
        department?: string;
    };
    // Add other user fields as needed
}

export interface SessionInfo {
    id: number;
    date: string;
    login_at: string;
    status: string;
}

export interface LoginResponse {
    token: string;
    user: User;
    session?: SessionInfo;
    message?: string;
    status: number;
}

export type LogoutType = 'LOGOUT' | 'ON_WORK' | 'STAY_IN_OFFICE';

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ login: username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store session
            if (data.statusCode === 2000 && data.data) {
                const { access_token, user, roles, permissions, session } = data.data;

                if (access_token) {
                    localStorage.setItem('token', access_token);
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('roles', JSON.stringify(roles));
                    localStorage.setItem('permissions', JSON.stringify(permissions));

                    // Store session info if available
                    if (session) {
                        localStorage.setItem('session', JSON.stringify(session));
                    }
                }

                return data;
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout with optional logout type
     * @param logoutType - 'LOGOUT' (end day), 'ON_WORK' (field work), 'STAY_IN_OFFICE' (idle)
     * @param remarks - Optional notes
     */
    logout: async (logoutType: LogoutType = 'LOGOUT', remarks?: string): Promise<void> => {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    logout_type: logoutType,
                    remarks
                })
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage for all logout types
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('roles');
            localStorage.removeItem('permissions');
            localStorage.removeItem('session');
        }
    },

    /**
     * Get current session from localStorage
     */
    getCurrentSession: (): SessionInfo | null => {
        if (typeof window === 'undefined') return null;
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
            try {
                return JSON.parse(sessionStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    getCurrentUser: (): User | null => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    isAuthenticated: (): boolean => {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('token');
    },

    hasPermission: (permission: string): boolean => {
        if (typeof window === 'undefined') return false;

        const permissionsStr = localStorage.getItem('permissions');
        if (!permissionsStr) return false;

        try {
            const permissions = JSON.parse(permissionsStr);
            return Array.isArray(permissions) && permissions.some((p: any) => p.name === permission);
        } catch (e) {
            console.error('Error parsing permissions from localStorage', e);
            return false;
        }
    },

    // Check if user possesses any permission in a module matching an action suffix
    hasModulePermission: (module: string, action: string): boolean => {
        if (typeof window === 'undefined') return false;
        if (authService.hasRole('super_admin')) return true;

        const permissionsStr = localStorage.getItem('permissions');
        if (!permissionsStr) return false;

        try {
            const permissions = JSON.parse(permissionsStr);
            if (!Array.isArray(permissions)) return false;

            return permissions.some((p: any) => {
                const isSameModule = p.module === module || (!p.module && module === 'System');
                const isActionMatch = p.name.endsWith('.' + action) || p.name === action;
                return isSameModule && isActionMatch;
            });
        } catch (e) {
            return false;
        }
    },

    hasRole: (roleName: string): boolean => {
        if (typeof window === 'undefined') return false;
        const rolesStr = localStorage.getItem('roles');
        if (!rolesStr) return false;

        try {
            const roles = JSON.parse(rolesStr);
            return Array.isArray(roles) && roles.some((r: any) => r.name === roleName);
        } catch (e) {
            console.error('Error parsing roles from localStorage', e);
            return false;
        }
    },
    refreshProfile: async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getHeaders()
            });
            const data = await response.json();
            if (response.ok && data.statusCode === 2000) {
                const { user, roles, permissions } = data.data;
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('roles', JSON.stringify(roles));
                localStorage.setItem('permissions', JSON.stringify(permissions));
            }
        } catch (error) {
            console.error('Failed to refresh profile', error);
        }
    },

    getProfile: async (): Promise<User> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: getHeaders()
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch profile');
            }
            return data.data.user;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    changePassword: async (userId: number, currentPassword: string, newPassword: string, confirmPassword: string): Promise<any> => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isSelf = currentUser.id === userId;

            // Use specialized profile endpoint if changing own password
            const endpoint = isSelf ? `${API_BASE_URL}/auth/change-password` : `${API_BASE_URL}/users/${userId}/change-password`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    forgotPassword: async (email: string): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/password/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send reset link');
            return data;
        } catch (error) {
            throw error;
        }
    },

    resetPassword: async (data: any): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/password/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || 'Failed to reset password');
            return responseData;
        } catch (error) {
            throw error;
        }
    },

    getHighestHierarchy: (): number => {
        if (typeof window === 'undefined') return 1000;
        const rolesStr = localStorage.getItem('roles');
        if (!rolesStr) return 1000;
        try {
            const roles = JSON.parse(rolesStr);
            if (!Array.isArray(roles) || roles.length === 0) return 1000;

            // Try to find the actual hierarchy first
            const hierarchies = roles
                .map((r: any) => r.hierarchy)
                .filter((h: any) => h !== undefined && h !== null);

            if (hierarchies.length > 0) {
                return Math.min(...hierarchies);
            }

            // Fallback for legacy sessions (pre-hierarchy sync)
            if (roles.some((r: any) => r.name === 'super_admin')) return 1;
            if (roles.some((r: any) => r.name === 'admin')) return 10;
            if (roles.some((r: any) => r.name === 'manager')) return 100;

            return 1000;
        } catch (e) {
            return 1000;
        }
    }
};
