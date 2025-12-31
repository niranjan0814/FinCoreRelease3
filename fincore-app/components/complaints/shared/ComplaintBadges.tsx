import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Open': return <AlertCircle className="w-4 h-4" />;
            case 'In Progress': return <Clock className="w-4 h-4" />;
            case 'Resolved': return <CheckCircle className="w-4 h-4" />;
            case 'Closed': return <CheckCircle className="w-4 h-4" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Open': return 'bg-red-100 text-red-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Resolved': return 'bg-green-100 text-green-700';
            case 'Closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            {status}
        </span>
    );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700';
            case 'Medium': return 'bg-yellow-100 text-yellow-700';
            case 'Low': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(priority)}`}>
            {priority}
        </span>
    );
};
