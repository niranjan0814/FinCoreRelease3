import { X, Users, MapPin, Calendar, User, Building2, Clock, Info, ExternalLink, CheckCircle, Edit2, AlertCircle, Trash2 } from 'lucide-react';
import { Center } from '../../types/center.types';
import { colors } from '../../themes/colors';

interface CenterDetailsModalProps {
    center: Center;
    isOpen: boolean;
    onClose: () => void;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    isFieldOfficer?: boolean;
}

export function CenterDetailsModal({ center, isOpen, onClose, onApprove, onReject, onEdit, onDelete, isFieldOfficer }: CenterDetailsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Clean Header matching CenterForm */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary[50] }}>
                            <Users className="w-5 h-5" style={{ color: colors.primary[600] }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{center.center_name}</h2>
                            <p className="text-[10px] text-gray-500 font-mono tracking-wider">{center.CSU_id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {/* Highlight Box */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${center.status === 'active' ? 'bg-green-500 animate-pulse' : center.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <span className={`text-sm font-bold ${center.status === 'active' ? 'text-green-700' : center.status === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                                    {center.status === 'inactive' ? 'Pending Approval' : center.status.charAt(0).toUpperCase() + center.status.slice(1)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Groups</span>
                            <p className="text-sm font-bold text-gray-900">{center.group_count || 0} Registered</p>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <InfoItem
                            label="Associated Branch"
                            value={center.branch?.branch_name || center.branch_id}
                            icon={<Building2 size={14} />}
                        />
                        <InfoItem
                            label="Location Context"
                            value={center.location || 'N/A'}
                            icon={<MapPin size={14} />}
                        />
                        <InfoItem
                            label="Assigned Officer"
                            value={center.staff?.full_name || 'Unassigned'}
                            icon={<User size={14} />}
                        />
                        <InfoItem
                            label="Contact ID"
                            value={center.staff_id || 'N/A'}
                            icon={<ExternalLink size={14} />}
                        />
                    </div>

                    {/* Rejection Feedback - Premium Alert Style */}
                    {center.status === 'rejected' && center.rejection_reason && (
                        <div className="overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-100/50 border-b border-red-100">
                                <AlertCircle size={14} className="text-red-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Official Feedback</span>
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-medium leading-relaxed text-red-900 italic">
                                    "{center.rejection_reason}"
                                </p>

                            </div>
                        </div>
                    )}

                    {/* Meeting Schedule Section */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-50 pb-2">
                            <Calendar size={12} />
                            <span>Meeting Schedule</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {center.open_days && center.open_days.length > 0 ? (
                                center.open_days.map((schedule, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{schedule.day}</p>
                                                {schedule.date && <p className="text-[10px] text-gray-400">{schedule.date}</p>}
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-gray-50 rounded text-xs font-mono font-bold text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                                            {schedule.time}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-xs text-gray-400 italic font-medium">No schedules configured for this center</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Card */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-50 pb-2">
                            <MapPin size={12} />
                            <span>Geographic Address</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-50/50 italic">
                            {center.address || 'No address details provided for this location.'}
                        </p>
                    </div>
                </div>

                {/* Footer with Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 z-10">
                    <div className="flex-1">
                        {center.status === 'inactive' && (
                            <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold italic">
                                <Info size={10} />
                                Awaiting Approval
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-white transition-colors"
                        >
                            Close
                        </button>

                        {onDelete && center.status === 'inactive' && isFieldOfficer && (center.groups_count || 0) === 0 && (center.customers_count || 0) === 0 && (!center.open_days || center.open_days.length === 0) && (
                            <button
                                onClick={() => {
                                    onDelete(center.id);
                                    onClose();
                                }}
                                className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <Trash2 size={14} />
                                Delete Request
                            </button>
                        )}

                        {onEdit && (center.status !== 'rejected' || isFieldOfficer) && (
                            <button
                                onClick={() => {
                                    onEdit(center.id);
                                    onClose();
                                }}
                                className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>
                        )}

                        {center.status === 'inactive' && onReject && (
                            <button
                                onClick={() => {
                                    onReject(center.id);
                                    onClose();
                                }}
                                className="px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <X size={14} />
                                Reject Request
                            </button>
                        )}

                        {center.status === 'inactive' && onApprove && (
                            <button
                                onClick={() => {
                                    onApprove(center.id);
                                    onClose();
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center gap-1.5"
                            >
                                <CheckCircle size={14} />
                                Approve Center
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
    if (!label) return null;

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 uppercase text-[9px] font-black tracking-tighter">
                {icon}
                <span>{String(label)}</span>
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">
                {value !== undefined && value !== null ? String(value) : 'N/A'}
            </p>
        </div>
    );
}
