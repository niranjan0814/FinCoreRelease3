export interface LeaveRequestFormData {
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays?: number;
    reason: string;
}

export interface LeaveRequest extends LeaveRequestFormData {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}
