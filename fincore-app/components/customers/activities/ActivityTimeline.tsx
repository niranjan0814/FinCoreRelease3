import React, { useEffect, useState } from 'react';
import { CustomerActivity, customerActivityService } from '@/services/customerActivity.service';
import { Calendar, User, MessageCircle, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface ActivityTimelineProps {
    customerId: number;
    refreshTrigger: number; // Increment to refresh list
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ customerId, refreshTrigger }) => {
    const [activities, setActivities] = useState<CustomerActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadActivities = async () => {
            setIsLoading(true);
            try {
                const data = await customerActivityService.getAll(customerId);
                setActivities(data);
            } catch (error) {
                console.error('Failed to load activities', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (customerId) {
            loadActivities();
        }
    }, [customerId, refreshTrigger]);

    const getBehaviorColor = (behavior?: string) => {
        switch (behavior?.toLowerCase()) {
            case 'positive': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'aggressive': return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 font-bold';
            case 'cooperative': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-gray-500 text-sm">Loading timeline...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="p-8 text-center border-l-2 border-gray-100 dark:border-gray-800 ml-4">
                <p className="text-gray-400 text-sm">No activity history found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 ml-2 mt-6">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 pb-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-400"></div>

                    <div className="bg-white dark:bg-gray-800/40 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`inline-block px-2 py-0.5 rounded textxs font-medium mr-2 mb-1 ${activity.activity_type === 'Collection' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {activity.activity_type}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(activity.activity_date).toLocaleDateString()}
                                </span>
                            </div>

                            {activity.customer_behavior && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBehaviorColor(activity.customer_behavior)}`}>
                                    {activity.customer_behavior}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                            {activity.description}
                        </p>

                        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {activity.staff_name}
                            </span>
                            {activity.outcome && (
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Outcome: {activity.outcome}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
