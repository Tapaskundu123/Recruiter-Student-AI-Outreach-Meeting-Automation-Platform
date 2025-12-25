import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Database,
    Mail,
    Calendar,
    Users,
    TrendingUp,
    Menu,
    X,
    Clock,
    File,
    LogOut
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { api } from '../../lib/api';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Clock, label: 'Availability', path: '/admin/availability' },
    { icon: Mail, label: 'Campaigns', path: '/admin/campaigns' },
    { icon: Calendar, label: 'Meetings', path: '/admin/meetings' },
    { icon: Users, label: 'Leads', path: '/admin/leads' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
    { icon: File, label: 'CSV Uploads', path: '/admin/csv-upload' }
];

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { admin, logout } = useAdminAuth();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            try {
                await api.adminLogout();
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                logout();
                window.location.href = '/admin/login';
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: 0 }}
                animate={{ x: isSidebarOpen ? 0 : -280 }}
                className="fixed left-0 top-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 shadow-xl"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-gradient">AI Outreach</h1>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link key={item.path} to={item.path}>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                            isActive
                                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{admin?.name || 'Admin User'}</p>
                                <p className="text-xs text-slate-500 truncate">{admin?.email || 'admin@example.com'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors group"
                        >
                            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div
                className={cn(
                    "transition-all duration-300",
                    isSidebarOpen ? "ml-72" : "ml-0"
                )}
            >
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-glow" />
                            Backend Connected
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                />
            )}
        </div>
    );
}
