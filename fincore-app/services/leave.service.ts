import { API_BASE_URL, getHeaders } from './api.config';
import { LeaveRequestFormData } from '../types/leave.types';

export const leaveService = {
    submitLeaveRequest: async (data: LeaveRequestFormData): Promise<any> => {
        console.log("Submit leave request triggered", data);
        // Placeholder for when backend leave management is implemented
        return { success: true, message: "Leave request submitted (Placeholder)" };
    },

    getLeaveRequests: async (): Promise<any[]> => {
        // Placeholder
        return [];
    }
};
