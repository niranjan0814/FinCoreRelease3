import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Edit2, RotateCcw, Activity } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance.types';

interface AttendanceDailyTableProps {
    records: AttendanceRecord[];
    onUpdate: (id: string, updates: Partial<AttendanceRecord>) => void;
}

export const AttendanceDailyTable: React.FC<AttendanceDailyTableProps> = ({ records, onUpdate }) => {

    // Helper to format 24h time to 12h with AM/PM
    const formatTime12h = (time24?: string) => {
        if (!time24) return '--:--';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'
        return `${h}:${m} ${ampm}`;
    };

    const statusConfig = {
        'Present': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        'Absent': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        'Half Day': { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        'Leave': { icon: Edit2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        'Not Marked': { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' }
    };



    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Worked Duration</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {records.map((record) => {
                            const config = statusConfig[record.status] || statusConfig['Not Marked'];
                            const StatusIcon = config.icon;

                            return (
                                <tr key={record.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                    {/* Staff Name & ID */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm overflow-hidden border border-white dark:border-gray-800 shadow-sm">
                                                    {record.avatar ? (
                                                        <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        record.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                {record.isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm animate-pulse" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.name}</p>
                                                    {record.isOnline && (
                                                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter flex items-center gap-1">
                                                            <Activity className="w-2.5 h-2.5" /> Online
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-medium">#{record.id}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Daily Status */}
                                    <td className="px-6 py-5">
                                        <div className="relative inline-block">
                                            <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${config.bg} ${config.color} ${config.border}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {record.status}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Check In */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{record.checkIn || '--:--'}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 pl-1 uppercase tracking-tight">
                                                {formatTime12h(record.checkIn)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Check Out */}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-lg">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{record.checkOut || '--:--'}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 pl-1 uppercase tracking-tight">
                                                {formatTime12h(record.checkOut)}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Duration */}
                                    <td className="px-6 py-5">
                                        {record.isOnline ? (
                                            <div className="flex flex-col">
                                                <span className="text-blue-600 dark:text-blue-400 text-sm font-black flex items-center gap-1.5">
                                                    {record.workedHours?.toFixed(2)}h
                                                    <span className="flex h-1.5 w-1.5 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                                    </span>
                                                </span>
                                                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">In Progress</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black ${record.workedHours && record.workedHours >= 7 ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {record.workedHours ? `${record.workedHours.toFixed(2)}h` : '--'}
                                                </span>
                                                {record.workedHours && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Completed</span>}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-5 text-right"></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {records.length === 0 && (
                <div className="py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No staff records found for this date.</p>
                </div>
            )}
        </div>
    );
};
