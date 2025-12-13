import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DashboardLayout from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import {
    Users,
    UserCheck,
    Mail,
    Calendar,
    TrendingUp,
    Activity,
    Zap,
    Clock
} from 'lucide-react';

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.getDashboardStats().then(res => res.data)
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
                </div>
            </DashboardLayout>
        );
    }

    const overview = stats?.overview || {};
    const campaignMetrics = stats?.campaignMetrics || {};

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Welcome back! Here's what's happening with your outreach platform.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Recruiters"
                        value={overview.totalRecruiters?.toLocaleString() || '0'}
                        icon={UserCheck}
                        color="purple"
                        index={0}
                    />
                    <StatCard
                        title="Waitlist Students"
                        value={overview.waitlistCount?.toLocaleString() || '0'}
                        icon={Users}
                        color="blue"
                        index={1}
                    />
                    <StatCard
                        title="Active Campaigns"
                        value={overview.activeCampaigns?.toLocaleString() || '0'}
                        icon={Mail}
                        color="pink"
                        index={2}
                    />
                    <StatCard
                        title="Upcoming Meetings"
                        value={overview.upcomingMeetings?.toLocaleString() || '0'}
                        icon={Calendar}
                        color="green"
                        index={3}
                    />
                </div>

                {/* Campaign Performance */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="card-hover">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                                Campaign Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Total Sent</span>
                                    <span className="font-semibold">{campaignMetrics.totalSent?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 w-full" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Open Rate</span>
                                    <span className="font-semibold text-blue-600">{campaignMetrics.avgOpenRate || '0'}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${campaignMetrics.avgOpenRate || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Click Rate</span>
                                    <span className="font-semibold text-pink-600">{campaignMetrics.avgClickRate || '0'}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-pink-500"
                                        style={{ width: `${campaignMetrics.avgClickRate || 0}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-hover">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ActivityItem
                                icon={Zap}
                                title="Scraping Job Completed"
                                description="Found 45 new recruiters"
                                time="5 min ago"
                                color="purple"
                            />
                            <ActivityItem
                                icon={Mail}
                                title="Campaign Sent"
                                description="Tech Recruiting Spring 2025"
                                time="1 hour ago"
                                color="blue"
                            />
                            <ActivityItem
                                icon={Calendar}
                                title="Meeting Scheduled"
                                description="5 new meetings booked"
                                time="2 hours ago"
                                color="green"
                            />
                            <ActivityItem
                                icon={Users}
                                title="New Waitlist Signups"
                                description="12 students joined"
                                time="3 hours ago"
                                color="pink"
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-4">
                            <QuickAction
                                icon={Zap}
                                title="Start Scraping"
                                description="Find new leads"
                                href="/admin/scraping"
                            />
                            <QuickAction
                                icon={Mail}
                                title="New Campaign"
                                description="Send emails"
                                href="/admin/campaigns"
                            />
                            <QuickAction
                                icon={Calendar}
                                title="Schedule Meeting"
                                description="Book a call"
                                href="/admin/meetings"
                            />
                            <QuickAction
                                icon={TrendingUp}
                                title="View Analytics"
                                description="Check performance"
                                href="/admin/analytics"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color, index }) {
    const colors = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        pink: 'from-pink-500 to-pink-600',
        green: 'from-green-500 to-green-600'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="card-hover overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
                            <p className="text-3xl font-bold">{value}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Activity Item Component
function ActivityItem({ icon: Icon, title, description, time, color }) {
    const colors = {
        purple: 'bg-purple-100 text-purple-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        pink: 'bg-pink-100 text-pink-600'
    };

    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {time}
            </div>
        </div>
    );
}

// Quick Action Component
function QuickAction({ icon: Icon, title, description, href }) {
    return (
        <a href={href}>
            <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group"
            >
                <Icon className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </motion.div>
        </a>
    );
}
