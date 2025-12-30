export interface TodaySession {
    id: number;
    date: string;
    login_at: string | null;
    logout_at: string | null;
    logout_type: string | null;
    status: 'OPEN' | 'CLOSED';
    worked_minutes: number;
    attendance_status: 'PRESENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    auto_logged_out: boolean;
    remarks: string | null;
    approved_by: number | null;
    approved_at: string | null;
}

export interface User {
    id: string;
    name: string;
    staffId?: string; // Staff ID for staff members (e.g., ST0001)
    email: string;
    role: string;
    branch: string;
    branchId?: number | string | null;
    status: 'Active' | 'Inactive' | 'Blocked';
    // Session-related fields
    is_locked?: boolean;
    locked_until?: string | null;
    today_session?: TodaySession | null;
}

export interface Staff {
    staff_id: string; // Primary Key
    full_name: string;
    email_id: string;
    branch_id?: string;
    // Add other fields as needed
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    level: string;
}

export interface Permission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
}

export interface StaffStats {
    totalUsers: number;
    activeUsers: number;
    totalRoles: number;
}
