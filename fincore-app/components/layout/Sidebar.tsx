import React from 'react';
import { authService } from '../../services/auth.service';
import {
    LayoutDashboard,
    Building2,
    Users,
    UsersRound,
    User,
    FileText,
    DollarSign,
    ClipboardList,
    BarChart3,
    Wallet,
    TrendingUp,
    Settings,
    ChevronDown,
    Globe,
    Shield,
    AlertCircle,
    ArrowLeftRight,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar,
    Package,
    MessageSquare,
    PieChart,
    ShieldCheck,
    RotateCcw
} from 'lucide-react';
import { Page } from './MainLayout';

interface SidebarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    userRole: string;
}

interface MenuItem {
    id: Page;
    label: string;
    icon: React.ReactNode;
    submenu?: MenuItem[];
    roles?: string[];
    permission?: string;
}

export function Sidebar({ currentPage, onNavigate, isOpen, userRole }: SidebarProps) {
    const [expandedMenus, setExpandedMenus] = React.useState<string[]>(['loans', 'collections-section', 'finance']);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const menuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            permission: 'dashboard.view'
        },
        {
            id: 'branches',
            label: 'Branches',
            icon: <Building2 className="w-5 h-5" />,
            permission: 'branches.view'
        },
        {
            id: 'centers-section' as Page,
            label: 'Centers (CSU)',
            icon: <Users className="w-5 h-5" />,
            submenu: [
                {
                    id: 'centers',
                    label: 'Schedule',
                    icon: <ClipboardList className="w-4 h-4" />
                },
                {
                    id: 'meeting-scheduling',
                    label: 'Meeting Schedule',
                    icon: <ClipboardList className="w-4 h-4" />,
                    roles: ['super_admin', 'admin', 'manager', 'staff']
                },
                {
                    id: 'center-requests',
                    label: 'Transfer Requests',
                    icon: <ArrowLeftRight className="w-4 h-4" />,
                    roles: ['super_admin', 'admin', 'manager']
                }
            ],
            permission: 'centers.view'
        },
        {
            id: 'groups',
            label: 'Groups',
            icon: <UsersRound className="w-5 h-5" />,
            permission: 'groups.view'
        },
        {
            id: 'customers-section' as Page,
            label: 'Customers',
            icon: <User className="w-5 h-5" />,
            submenu: [
                {
                    id: 'customers',
                    label: 'Customer List',
                    icon: <ClipboardList className="w-4 h-4" />
                },
                {
                    id: 'customer-requests' as Page,
                    label: 'Edit Approvals',
                    icon: <ShieldCheck className="w-4 h-4" />,
                    roles: ['super_admin', 'admin', 'manager']
                }
            ],
            permission: 'customers.view'
        },
        {
            id: 'shareholders',
            label: 'Shareholders',
            icon: <PieChart className="w-5 h-5" />
        }
    ];

    const productMenuItems: MenuItem[] = [
        { id: 'loan-product' as Page, label: 'Loan', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'investments' as Page, label: 'Investment', icon: <TrendingUp className="w-4 h-4" /> }
    ];

    const loanMenuItems: MenuItem[] = [
        { id: 'loan-create' as Page, label: 'Create Loan', icon: <FileText className="w-4 h-4" />, permission: 'loans.create' },
        { id: 'loan-approval' as Page, label: 'Loan Approval', icon: <Shield className="w-4 h-4" />, permission: 'loans.approve' },
        { id: 'loan-sent-back' as Page, label: 'Sent Back Loans', icon: <AlertCircle className="w-4 h-4" />, permission: 'loans.view' },
        { id: 'loan-list' as Page, label: 'Loan List', icon: <ClipboardList className="w-4 h-4" />, permission: 'loans.view' }
    ];

    const collectionMenuItems: MenuItem[] = [
        { id: 'due-list' as Page, label: 'Due List', icon: <ClipboardList className="w-4 h-4" />, permission: 'collections.view' },
        { id: 'collections' as Page, label: 'Collections', icon: <DollarSign className="w-4 h-4" />, permission: 'collections.view' },
        { id: 'receipt-rejections' as Page, label: 'Cancellation Requests', icon: <RotateCcw className="w-4 h-4" />, permission: 'receipts.approvecancel' },
        { id: 'collection-summary' as Page, label: 'Collection Summary', icon: <Receipt className="w-4 h-4" />, permission: 'collections.view' }
    ];

    const financeMenuItems: MenuItem[] = [
        { id: 'finance' as Page, label: 'Finance Overview', icon: <Wallet className="w-4 h-4" />, permission: 'finance.view' },
        { id: 'fund-transactions' as Page, label: 'Fund Transactions', icon: <ArrowLeftRight className="w-4 h-4" />, permission: 'finance.transactions' },
        { id: 'branch-transactions' as Page, label: 'Branch Transactions', icon: <Building2 className="w-4 h-4" />, permission: 'finance.view' }
    ];

    const toggleMenu = (menuId: string) => {
        if (!isCollapsed) {
            setExpandedMenus(prev =>
                prev.includes(menuId)
                    ? prev.filter(id => id !== menuId)
                    : [...prev, menuId]
            );
        }
    };

    const renderMenuItem = (item: MenuItem) => {
        // Role-based filtering (legacy support)
        if (item.roles && !item.roles.includes(userRole)) {
            return null;
        }

        const hasSubmenu = item.submenu && item.submenu.length > 0;
        // const isActive = currentPage === item.id || (hasSubmenu && item.submenu?.some(sub => currentPage === sub.id));
        const isExpanded = expandedMenus.includes(item.id as string);
        // Permission-based filtering (preferred)
        // During hydration (isMounted = false), we return null for any item requiring a permission
        // to match the server-side render where hasPermission always returns false.
        if (item.permission && (!isMounted || !authService.hasPermission(item.permission))) {
            return null;
        }

        const isActive = currentPage === item.id;

        if (hasSubmenu) {
            return (
                <div key={item.id}>
                    {isCollapsed ? (
                        <button
                            onClick={() => toggleMenu(item.id as string)}
                            className={`w-full flex items-center justify-center px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
                            title={item.label}
                        >
                            <div className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} group-hover:text-gray-700 dark:group-hover:text-gray-300`}>
                                {item.icon}
                            </div>
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                {item.label}
                            </div>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => toggleMenu(item.id as string)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} group-hover:text-gray-700 dark:group-hover:text-gray-300`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {isExpanded && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                                    {item.submenu?.map(subItem => {
                                        if (subItem.roles && !subItem.roles.includes(userRole)) return null;
                                        if (subItem.permission && (!isMounted || !authService.hasPermission(subItem.permission))) return null;
                                        const isSubActive = currentPage === subItem.id;
                                        return (
                                            <button
                                                key={subItem.id}
                                                onClick={() => onNavigate(subItem.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${isSubActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                {subItem.icon}
                                                <span>{subItem.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }

        // Regular menu item
        return (
            <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                title={isCollapsed ? item.label : ''}
            >
                <div className={`${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                    {item.icon}
                </div>
                {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item.label}
                    </div>
                )}
            </button>
        );
    };

    return (
        <aside className={`
      fixed lg:static inset-y-0 left-0 z-50
      ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 flex flex-col border-r border-gray-200 dark:border-gray-700
      transform transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
            {/* Logo */}
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-3' : 'px-4'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">LMS</h2>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Microfinance</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {/* Main Section */}
                {!isCollapsed && (
                    <div className="px-3 mb-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Main</p>
                    </div>
                )}

                {/* Main Menu Items */}
                {menuItems.map(renderMenuItem)}

                {/* Products Section */}
                <div className="pt-3">
                    {!isCollapsed && (
                        <div className="px-3 mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</p>
                        </div>
                    )}

                    {isCollapsed ? (
                        <button
                            onClick={() => toggleMenu('products')}
                            className="w-full flex items-center justify-center px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group relative"
                            title="Product"
                        >
                            <Package className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Product
                            </div>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => toggleMenu('products')}
                                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                    <span className="text-sm font-medium">Product</span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedMenus.includes('products') ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {expandedMenus.includes('products') && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                                    {productMenuItems.map(item => {
                                        const isActive = currentPage === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Loans Section */}
                <div className="pt-3">
                    {!isCollapsed && (
                        <div className="px-3 mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Loans</p>
                        </div>
                    )}

                    {isCollapsed ? (
                        // Collapsed view - show icon only
                        <button
                            onClick={() => toggleMenu('loans')}
                            className="w-full flex items-center justify-center px-3 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group relative"
                            title="Loans"
                        >
                            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Loans
                            </div>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => toggleMenu('loans')}
                                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
                                    <span className="text-sm font-medium">Loans</span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedMenus.includes('loans') ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {expandedMenus.includes('loans') && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                                    {loanMenuItems.map(item => {
                                        if (item.roles && !item.roles.includes(userRole)) return null;
                                        if (item.permission && (!isMounted || !authService.hasPermission(item.permission))) return null;
                                        const isActive = currentPage === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${isActive
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Collections Section */}
                <div className="pt-3">
                    {!isCollapsed && (
                        <div className="px-3 mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Collections</p>
                        </div>
                    )}
                    {renderMenuItem({
                        id: 'collections-section' as Page,
                        label: 'Collections',
                        icon: <DollarSign className="w-5 h-5" />,
                        submenu: collectionMenuItems
                    })}
                </div>

                {/* Reports */}
                {!isCollapsed && (
                    <div className="px-3 mb-2 pt-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Analytics</p>
                    </div>
                )}

                <button
                    onClick={() => onNavigate('reports')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'reports'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    title={isCollapsed ? 'Reports' : ''}
                >
                    <div className={`${currentPage === 'reports' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    {!isCollapsed && <span className="text-sm font-medium">Reports</span>}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Reports
                        </div>
                    )}
                </button>

                {/* Finance Section */}
                <div className="pt-3">
                    {!isCollapsed && (
                        <div className="px-3 mb-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Finance</p>
                        </div>
                    )}

                    {isCollapsed ? (
                        <button
                            onClick={() => toggleMenu('finance')}
                            className="w-full flex items-center justify-center px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all group relative"
                            title="Finance"
                        >
                            <Wallet className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Finance
                            </div>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => toggleMenu('finance')}
                                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Wallet className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                                    <span className="text-sm font-medium">Finance</span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${expandedMenus.includes('finance') ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {expandedMenus.includes('finance') && (
                                <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
                                    {financeMenuItems.map(item => {
                                        if (item.roles && !item.roles.includes(userRole)) return null;
                                        if (item.permission && (!isMounted || !authService.hasPermission(item.permission))) return null;
                                        const isActive = currentPage === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onNavigate(item.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${isActive
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Staff Management */}

                {/* Staff Management */}
                {isMounted && authService.hasPermission('staff.view') && (
                    <button
                        onClick={() => onNavigate('staff-management')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'staff-management'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        title={isCollapsed ? 'Staff Management' : ''}
                    >
                        <div className={`${currentPage === 'staff-management' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                            <Users className="w-5 h-5" />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Staff</span>}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Staff Management
                            </div>
                        )}
                    </button>
                )}

                {/* Roles & Privileges */}
                {isMounted && authService.hasPermission('roles.view') && (
                    <button
                        onClick={() => onNavigate('roles-privileges')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'roles-privileges'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        title={isCollapsed ? 'Roles & Privileges' : ''}
                    >
                        <div className={`${currentPage === 'roles-privileges' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                            <Shield className="w-5 h-5" />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Roles</span>}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Roles & Privileges
                            </div>
                        )}
                    </button>
                )}

                {/* Complaints */}
                <button
                    onClick={() => onNavigate('complaints')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'complaints'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    title={isCollapsed ? 'Complaints' : ''}
                >
                    <div className={`${currentPage === 'complaints' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    {!isCollapsed && <span className="text-sm font-medium">Complaints</span>}
                    {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Complaints
                        </div>
                    )}
                </button>

                {/* System Config */}
                {isMounted && authService.hasPermission('settings.view') && (
                    <>
                        {!isCollapsed && (
                            <div className="px-3 mb-2 pt-3">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Settings</p>
                            </div>
                        )}

                        <button
                            onClick={() => onNavigate('system-config')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'system-config'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            title={isCollapsed ? 'System Config' : ''}
                        >
                            <div className={`${currentPage === 'system-config' ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                <Settings className="w-5 h-5" />
                            </div>
                            {!isCollapsed && <span className="text-sm font-medium">System Config</span>}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    System Config
                                </div>
                            )}
                        </button>
                    </>
                )}

                {/* Public Website */}
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                    {/* Documents */}
                    <button
                        onClick={() => onNavigate('documents')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative mb-1 ${currentPage === 'documents'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title={isCollapsed ? 'Documents & Downloads' : ''}
                    >
                        <div className={`${currentPage === 'documents' ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                            <Download className="w-5 h-5" />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Documents</span>}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Documents & Downloads
                            </div>
                        )}
                    </button>

                    {/* Public Website */}
                    <button
                        onClick={() => onNavigate('public-website')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${currentPage === 'public-website'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title={isCollapsed ? 'Public Website' : ''}
                    >
                        <div className={`${currentPage === 'public-website' ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                            <Globe className="w-5 h-5" />
                        </div>
                        {!isCollapsed && <span className="text-sm font-medium">Public Website</span>}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                Public Website
                            </div>
                        )}
                    </button>
                </div>
            </nav>

            {/* Collapse Toggle Button */}
            <div className="hidden lg:block border-t border-gray-200 dark:border-gray-700 p-3">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all group"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
