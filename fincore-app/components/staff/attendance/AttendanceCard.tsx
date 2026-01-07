import React, { useEffect, useState } from 'react';
import { User as UserIcon, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Activity } from 'lucide-react';
import { AttendanceRecord } from '../../../types/attendance.types';

interface AttendanceCardProps {
    record: AttendanceRecord;
    onChange: (id: string, updates: Partial<AttendanceRecord>) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ record, onChange }) => {

    // Helper to format 24h time to 12h with AM/PM
    const formatTime12h = (time24?: string) => {
        if (!time24) return '--:--';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours);
        const m = minutes;
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    };

    const statusColors = {
        'Present': 'text-green-600 bg-green-50 border-green-200',
        'Absent': 'text-red-600 bg-red-50 border-red-200',
        'Half Day': 'text-orange-600 bg-orange-50 border-orange-200',
        'Leave': 'text-blue-600 bg-blue-50 border-blue-200',
        'Not Marked': 'text-gray-500 bg-gray-50 border-gray-200'
    };





    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border ${record.isOnline ? 'border-blue-500 shadow-blue-100 dark:shadow-none' : 'border-gray-200 dark:border-gray-700'} p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
            {record.isOnline && (
                <div className="absolute top-0 right-0 p-1.5 bg-blue-500 text-white rounded-bl-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 animate-pulse" /> Live Now
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden">
                            {record.avatar ? <img src={record.avatar} alt={record.name} className="w-full h-full object-cover" /> : record.name.substring(0, 2).toUpperCase()}
                        </div>
                        {record.isOnline && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse shadow-sm" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{record.name}</h3>
                        <p className="text-[11px] text-gray-500 font-medium">#{record.id} • {record.role}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-tight ${statusColors[record.status]}`}>
                        {record.status}
                    </div>
                    <div className="mt-2 text-xs font-black text-gray-400 group-hover:text-blue-500 transition-colors">
                        {record.workedHours?.toFixed(2)}h total
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            {record.status !== 'Leave' && !record.isOnline && (
                <div className="mb-5 p-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5 leading-none">
                        <AlertCircle className="w-3 h-3 text-blue-400" />
                        AUTO: 7h+ Present | 4-7h Half Day
                    </p>
                </div>
            )}



            {/* Time Check-in/out */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Check In</label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.checkIn || '--:--'}</span>
                    </div>
                    <div className="text-[10px] font-black text-gray-300 ml-1">
                        {formatTime12h(record.checkIn)}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Check Out</label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{record.checkOut || '--:--'}</span>
                    </div>
                    <div className="text-[10px] font-black text-gray-300 ml-1">
                        {formatTime12h(record.checkOut)}
                    </div>
                </div>
            </div>
        </div>
    );
};