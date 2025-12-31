import { Complaint, ComplaintFormData } from "@/types/complaint.types";
import { API_BASE_URL, getHeaders } from "./api.config";

export const complaintService = {
    getComplaints: async (search?: string, status?: string): Promise<{ data: Complaint[], meta: any }> => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status && status !== 'all') params.append('status', status);

            const response = await fetch(`${API_BASE_URL}/complaints?${params.toString()}`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch complaints');

            const json = await response.json();

            // Map backend fields to frontend interface if strictly needed, or ensure backend matches.
            // Backend fields: ticket_no, complainant_name, complainant_type, branch_name, category, subject, description, priority, status, assigned_to
            // Frontend interface: ticketNo, complainant, complainantType, branch, category, subject, description, priority, status, assignedTo

            const mappedData = json.data.map((item: any) => ({
                id: item.id.toString(),
                ticketNo: item.ticket_no,
                date: new Date(item.created_at).toISOString().split('T')[0], // Extract YYYY-MM-DD
                complainant: item.complainant_name,
                complainantType: item.complainant_type,
                branch: item.branch_name,
                category: item.category,
                subject: item.subject,
                description: item.description,
                priority: item.priority,
                status: item.status,
                assignedTo: item.assigned_to,
                resolution: item.resolution
            }));

            return { data: mappedData, meta: json.meta };
        } catch (error) {
            console.error(error);
            return { data: [], meta: {} };
        }
    },

    createComplaint: async (data: ComplaintFormData): Promise<Complaint | null> => {
        try {
            const payload = {
                complainant_name: data.complainant,
                complainant_type: data.complainantType,
                branch_name: data.branch,
                category: data.category,
                subject: data.subject,
                description: data.description,
                priority: data.priority,
                assigned_to: data.assignedTo
            };

            const response = await fetch(`${API_BASE_URL}/complaints`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create complaint');
            }

            const json = await response.json();
            const item = json.data;

            return {
                id: item.id.toString(),
                ticketNo: item.ticket_no,
                date: new Date(item.created_at).toISOString().split('T')[0],
                complainant: item.complainant_name,
                complainantType: item.complainant_type as any,
                branch: item.branch_name,
                category: item.category,
                subject: item.subject,
                description: item.description,
                priority: item.priority as any,
                status: item.status as any,
                assignedTo: item.assigned_to,
                resolution: item.resolution
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    updateStatus: async (id: string, status: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update status');
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
};
