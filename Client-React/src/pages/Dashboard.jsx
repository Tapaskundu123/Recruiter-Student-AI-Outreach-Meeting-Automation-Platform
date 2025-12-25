import { motion, useInView, useAnimation } from 'framer-motion';
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
    TrendingDown,
    Activity,
    Zap,
    Clock,
    Database,
    BarChart3,
    Target,
    FileText,
    Globe,
    ArrowUpRight,
    ArrowDownRight,
    Sparkles,
    CheckCircle2,
    Clock3
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import ConnectCalendar from '../components/ConnectCalendar';
import InterviewScheduleManager from '../components/InterviewScheduleManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useEffect, useRef, useState } from 'react';

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => api.getDashboardStats().then(res => res.data),
        refetchInterval: 30000 // Refetch every 30 seconds
    });

    const { recruiterId } = useParams();

    // If viewing a specific recruiter's dashboard (Calendar & Interview View)
    if (recruiterId) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Recruiter Dashboard</h1>
                        <p className="text-slate-600 dark:text-slate-400">Manage your calendar and scheduled interviews.</p>
                    </div>

                    <Tabs defaultValue="interviews" className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="interviews">Interviews</TabsTrigger>
                            <TabsTrigger value="calendar">Calendar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="interviews" className="mt-6">
                            <InterviewScheduleManager recruiterId={recruiterId} />
                        </TabsContent>
                        <TabsContent value="calendar" className="mt-6">
                            <ConnectCalendar embeddedRecruiterId={recruiterId} />
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        );
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Skeleton Loading */}
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
                        <div className="h-4 w-96 bg-slate-200 animate-pulse rounded"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const overview = stats?.overview || {};
    const campaignMetrics = stats?.campaignMetrics || {};

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">AI Outreach Dashboard</h1>
                            <p className="text-slate-600 dark:text-slate-400">
                                Platform Overview & Real-time Analytics
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <EnhancedStatCard
                        title="Total Recruiters"
                        value={overview.totalRecruiters || 0}
                        icon={UserCheck}
                        color="purple"
                        trend={{ value: 12, isUp: true }}
                        index={0}
                    />
                    <EnhancedStatCard
                        title="Waitlist Students"
                        value={overview.waitlistCount || 0}
                        icon={Users}
                        color="blue"
                        trend={{ value: 8, isUp: true }}
                        index={1}
                    />
                    <EnhancedStatCard
                        title="Active Campaigns"
                        value={overview.activeCampaigns || 0}
                        icon={Mail}
                        color="pink"
                        trend={{ value: 3, isUp: false }}
                        index={2}
                    />
                    <EnhancedStatCard
                        title="Upcoming Meetings"
                        value={overview.upcomingMeetings || 0}
                        icon={Calendar}
                        color="green"
                        trend={{ value: 15, isUp: true }}
                        index={3}
                    />
                </div>

                {/* Platform Features Showcase */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Platform Features</h2>
                            <p className="text-slate-600">Comprehensive AI-powered recruitment automation</p>
                        </div>
                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold">
                            9 Active Features
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {platformFeatures.map((feature, index) => (
                            <FeatureShowcaseCard key={index} {...feature} index={index} />
                        ))}
                    </div>
                </motion.div>

                {/* Campaign Performance & Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="card-hover-glow overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-500" />
                                    Campaign Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <MetricRow
                                    label="Total Sent"
                                    value={campaignMetrics.totalSent?.toLocaleString() || '0'}
                                    progress={100}
                                    color="purple"
                                />
                                <MetricRow
                                    label="Open Rate"
                                    value={`${campaignMetrics.avgOpenRate || 0}%`}
                                    progress={parseFloat(campaignMetrics.avgOpenRate || 0)}
                                    color="blue"
                                />
                                <MetricRow
                                    label="Click Rate"
                                    value={`${campaignMetrics.avgClickRate || 0}%`}
                                    progress={parseFloat(campaignMetrics.avgClickRate || 0)}
                                    color="pink"
                                />
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Total Campaigns</span>
                                        <span className="font-bold">{overview.totalCampaigns || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="card-hover-glow overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-green-500" />
                                    Platform Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <SummaryItem
                                    icon={Users}
                                    label="Total Students"
                                    value={overview.totalStudents?.toLocaleString() || '0'}
                                    color="blue"
                                />
                                <SummaryItem
                                    icon={Calendar}
                                    label="Total Meetings"
                                    value={overview.totalMeetings?.toLocaleString() || '0'}
                                    color="green"
                                />
                                <SummaryItem
                                    icon={FileText}
                                    label="Email Templates"
                                    value={overview.totalEmailTemplates?.toLocaleString() || '0'}
                                    color="purple"
                                />
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span>All systems operational</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-4 gap-4">
                                <QuickAction
                                    icon={Database}
                                    title="Import Data"
                                    description="Upload CSV files"
                                    href="/admin/csv-upload"
                                    gradient="from-purple-500 to-purple-600"
                                />
                                <QuickAction
                                    icon={Mail}
                                    title="New Campaign"
                                    description="Send emails"
                                    href="/admin/campaigns"
                                    gradient="from-blue-500 to-blue-600"
                                />
                                <QuickAction
                                    icon={Calendar}
                                    title="Schedule Meeting"
                                    description="Book a call"
                                    href="/admin/meetings"
                                    gradient="from-green-500 to-green-600"
                                />
                                <QuickAction
                                    icon={BarChart3}
                                    title="View Analytics"
                                    description="Check performance"
                                    href="/admin/analytics"
                                    gradient="from-pink-500 to-pink-600"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}

// Enhanced Stat Card with Count Animation and Trends
function EnhancedStatCard({ title, value, icon: Icon, color, trend, index }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setCount(value);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [isInView, value]);

    const colors = {
        purple: {
            gradient: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600'
        },
        blue: {
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600'
        },
        pink: {
            gradient: 'from-pink-500 to-pink-600',
            bg: 'bg-pink-100 dark:bg-pink-900/30',
            text: 'text-pink-600'
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            bg: 'bg-green-100 dark:bg-green-900/30',
            text: 'text-green-600'
        }
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative"
        >
            <Card className="card-hover-glow overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color].gradient} opacity-10 rounded-full -mr-16 -mt-16`} />
                <CardContent className="pt-6 relative">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
                            <motion.p
                                className="text-4xl font-bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.1 + 0.5 }}
                            >
                                {count.toLocaleString()}
                            </motion.p>
                        </div>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[color].gradient} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isUp ? (
                                <ArrowUpRight className="w-4 h-4" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4" />
                            )}
                            <span className="font-semibold">{trend.value}%</span>
                            <span className="text-slate-500">vs last month</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Feature Showcase Card
function FeatureShowcaseCard({ icon: Icon, title, description, status, stats, index }) {
    const statusColors = {
        active: 'bg-green-100 text-green-700 dark:bg-green-900/30',
        beta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
        soon: 'bg-slate-100 text-slate-700 dark:bg-slate-800'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group"
        >
            <Card className="card-hover-glow h-full">
                <CardContent className="pt-6">
                    <motion.div
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.6 }}
                        className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4"
                    >
                        <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors">{title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                            {status === 'active' ? 'Active' : status === 'beta' ? 'Beta' : 'Soon'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>
                    {stats && (
                        <div className="text-xs text-slate-500">
                            <span className="font-semibold text-purple-600">{stats}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

// Metric Row Component
function MetricRow({ label, value, progress, color }) {
    const colors = {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        pink: 'bg-pink-500'
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold">{value}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(progress, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${colors[color]} rounded-full`}
                />
            </div>
        </div>
    );
}

// Summary Item Component
function SummaryItem({ icon: Icon, label, value, color }) {
    const colors = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/30',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
    };

    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{label}</span>
            </div>
            <span className="text-2xl font-bold">{value}</span>
        </div>
    );
}

// Quick Action Component
function QuickAction({ icon: Icon, title, description, href, gradient }) {
    return (
        <a href={href}>
            <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-transparent hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-purple-600 transition-colors">{title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
            </motion.div>
        </a>
    );
}

// Platform Features Data
const platformFeatures = [
    {
        icon: Zap,
        title: 'AI Data Enrichment',
        description: 'Automatically discover and enrich recruiter and student profiles with intelligent data extraction.',
        status: 'active',
        stats: 'Processing enabled'
    },
    {
        icon: Mail,
        title: 'Smart Email Campaigns',
        description: 'Personalized outreach emails with AI-generated content for maximum engagement and response rates.',
        status: 'active',
        stats: 'Templates ready'
    },
    {
        icon: Calendar,
        title: 'Auto Scheduling',
        description: 'Seamless meeting coordination with Google Calendar integration and automated reminders.',
        status: 'active',
        stats: 'Calendar sync active'
    },
    {
        icon: Database,
        title: 'RAG System',
        description: 'Advanced Retrieval Augmented Generation for context-aware responses and intelligent processing.',
        status: 'active',
        stats: 'Vector DB ready'
    },
    {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'Comprehensive insights and metrics to track performance, engagement rates, and ROI in real-time.',
        status: 'active',
        stats: 'Live tracking'
    },
    {
        icon: Target,
        title: 'Smart Matching',
        description: 'AI-driven matching algorithm pairs recruiters with suitable candidates based on multiple factors.',
        status: 'beta',
        stats: 'Algorithm tuning'
    },
    {
        icon: Clock3,
        title: 'Real-time Tracking',
        description: 'Monitor email opens, clicks, and responses in real-time with detailed engagement analytics.',
        status: 'active',
        stats: 'Events tracked'
    },
    {
        icon: FileText,
        title: 'Template Management',
        description: 'Create, manage, and optimize email templates with AI assistance for better conversion rates.',
        status: 'active',
        stats: 'AI improvements'
    },
    {
        icon: Globe,
        title: 'Multi-platform Integration',
        description: 'Connect with LinkedIn, GitHub, and other platforms to enrich candidate data seamlessly.',
        status: 'active',
        stats: 'Integrations live'
    }
];
