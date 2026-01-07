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
    roleId?: number | string | null;
    roleName?: string;
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

// Session Summary for enhanced attendance tracking
export interface SessionSummary {
    user_id: number;
    total_logins: number;
    total_logins_this_month: number;
    total_logins_this_week: number;
    total_worked_minutes_this_month: number;
    total_worked_hours_this_month: number;
    average_session_duration_minutes: number;
    average_session_duration_hours: number;
    last_login_at: string | null;
    last_logout_at: string | null;
    is_currently_logged_in: boolean;
    current_session_duration_minutes: number;
    month_period: {
        start: string;
        end: string;
    };
}

// Session history item for detailed login/logout records
export interface SessionHistoryItem {
    id: number;
    user_id: number;
    date: string;
    login_at: string | null;
    logout_at: string | null;
    logout_type: 'LOGOUT' | 'ON_WORK' | 'STAY_IN_OFFICE' | 'AUTO_LOGOUT' | null;
    auto_logged_out: boolean;
    status: 'OPEN' | 'CLOSED';
    worked_minutes: number;
    worked_hours: number;
    attendance_status: 'PRESENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    approved_by: number | null;
    approved_at: string | null;
    remarks: string | null;
    login_ip: string | null;
}

// Session history response with pagination
export interface SessionHistoryResponse {
    user: {
        id: number;
        user_name: string;
        full_name: string;
    };
    sessions: SessionHistoryItem[];
    pagination: {
        total: number;
        offset: number;
        limit: number;
        has_more: boolean;
    };
    period_summary: {
        total_sessions: number;
        total_worked_minutes: number;
        total_worked_hours: number;
    };
}
