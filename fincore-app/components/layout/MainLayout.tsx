"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "../../services/auth.service";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export type Page =
    | 'dashboard' | 'branches' | 'centers' | 'groups' | 'customers'
    | 'loan-create' | 'loan-approval' | 'loan-sent-back' | 'loan-list' | 'loan-product'
    | 'due-list' | 'collections' | 'collection-summary'
    | 'reports'
    | 'finance' | 'fund-transactions' | 'branch-transactions'
    | 'investments' | 'staff-management' | 'roles-privileges'
    | 'shareholders'
    | 'complaints' | 'system-config' | 'documents' | 'public-website' | 'center-requests'
    | 'receipt-rejections'
    | string;

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isDarkMode } = useTheme();

    const [user, setUser] = useState<{ name: string; role: string; branch: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // If on login or public auth pages, we don't need to check auth to render
            if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password') {
                setIsLoading(false);
                return;
            }

            const isAuthenticated = authService.isAuthenticated();

            if (!isAuthenticated) {
                router.push('/login');
                setIsLoading(false);
                return;
            }

            // Sync profile data
            try {
                // Try to get from local storage first for instant render
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    const storedRolesStr = localStorage.getItem('roles');
                    let userRole = currentUser.role;

                    if (storedRolesStr) {
                        try {
                            const roles = JSON.parse(storedRolesStr);
                            if (Array.isArray(roles) && roles.length > 0) {
                                userRole = roles[0].name;
                            }
                        } catch (e) {
                            console.error("Failed to parse roles", e);
                        }
                    }

                    setUser({
                        name: currentUser.name,
                        role: userRole || 'Staff',
                        branch: 'Head Office'
                    });
                } else {
                    // If token exists but no user data, try to refresh
                    await authService.refreshProfile();
                    const refreshedUser = authService.getCurrentUser();
                    if (refreshedUser) {
                        // ... similar logic to set user ... (simplified for now)
                        setUser({
                            name: refreshedUser.name,
                            role: (localStorage.getItem('roles') ? JSON.parse(localStorage.getItem('roles')!)[0]?.name : null) || 'Staff',
                            branch: 'Head Office'
                        });
                    } else {
                        // Refresh failed, probably invalid token
                        authService.logout();
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error("Auth check failed", error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Securing session...</p>
                </div>
            </div>
        );
    }

    // If we are on the login, forgot-password page (or any other public page), render children directly without the shell
    if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/reset-password' || !user) {
        return (
            <>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    theme={isDarkMode ? "dark" : "light"}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                {children}
            </>
        );
    }

    // Determine current page ID from pathname
    const getCurrentPage = (): Page => {
        if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
        if (pathname === '/customers/requests') return 'customer-requests';

        // Extract the first segment after the slash
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
            return segments[0];
        }

        return 'dashboard';
    };

    const handleNavigate = (pageId: Page) => {
        const routeMap: Record<string, string> = {
            'dashboard': '/',
            'branches': '/branches',
            'centers': '/centers',
            'meeting-scheduling': '/meeting-scheduling',
            'groups': '/groups',
            'customers': '/customers',
            'loan-create': '/loans/create',
            'loan-approval': '/loans/approval',
            'loan-sent-back': '/loans/sent-back',
            'loan-list': '/loans',
            'loan-product': '/loan-product',
            'roles-privileges': '/roles-privileges',
            'customer-requests': '/customers/requests',
            'receipt-rejections': '/collections/rejections',
            'due-list': '/collections/due-list',
            'collections': '/collections',
        };

        const path = routeMap[pageId as string] || `/${pageId}`;
        router.push(path);
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
            // Force redirect anyway
            router.push('/login');
        }
    };

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                theme={isDarkMode ? "dark" : "light"}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <Sidebar
                    currentPage={getCurrentPage()}
                    onNavigate={handleNavigate}
                    isOpen={sidebarOpen}
                    userRole={user.role}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        user={user}
                        onLogout={handleLogout}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />

                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </ThemeProvider>
    );
}
