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
    | 'loan-create' | 'loan-approval' | 'loan-list' | 'loan-product'
    | 'due-list' | 'collections' | 'collection-summary'
    | 'reports'
    | 'finance' | 'fund-transactions' | 'branch-transactions'
    | 'investments' | 'staff-management' | 'roles-privileges'
    | 'complaints' | 'system-config' | 'documents' | 'public-website'
    | string;

function MainLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isDarkMode } = useTheme();

    const [user, setUser] = useState({
        name: "Admin User",
        role: "Super Admin", // Fallback Default
        branch: "Head Office"
    });

    useEffect(() => {
        authService.refreshProfile(); // Background refresh to sync hierarchy/permissions
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            // Try to get role from the stored roles array first
            const storedRolesStr = localStorage.getItem('roles');
            let userRole = currentUser.role;

            if (storedRolesStr) {
                try {
                    const roles = JSON.parse(storedRolesStr);
                    if (Array.isArray(roles) && roles.length > 0) {
                        // Use the name of the first role (e.g., 'super_admin')
                        userRole = roles[0].name;
                    }
                } catch (e) {
                    console.error("Failed to parse roles", e);
                }
            }

            setUser({
                name: currentUser.name,
                role: userRole || 'Staff',
                branch: 'Head Office' // You might want to store/retrieve this from user details too
            });
        }
    }, [pathname]);

    // If we are on the login page (or any other public page), render children directly without the shell
    if (pathname === '/login') {
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
            'loan-list': '/loans',
            'loan-product': '/loan-product',
            'roles-privileges': '/roles-privileges',
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
