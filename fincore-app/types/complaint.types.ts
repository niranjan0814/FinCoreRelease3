export interface Complaint {
    id: string;
    ticketNo: string;
    date: string;
    complainant: string;
    complainantType: 'Customer' | 'Staff' | 'Branch';
    branch: string;
    category: string;
    subject: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    assignedTo?: string;
    resolution?: string;
}

export interface ComplaintFormData {
    complainantType: 'Customer' | 'Staff' | 'Branch';
    complainant: string;
    branch: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    assignedTo: string;
    subject: string;
    description: string;
}
