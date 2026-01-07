export interface LeaveRequestFormData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveRequest extends LeaveRequestFormData {
    id: string;
    userId: string;
    userName: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt: string;
}
