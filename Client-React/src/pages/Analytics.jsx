import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { LineChartCard, DoughnutChartCard, BarChartCard, chartColors } from '../components/analytics/ChartComponents';
import DateRangePicker from '../components/analytics/DateRangePicker';
import { ExportCSVButton, ExportAllButton } from '../components/analytics/ExportButtons';
import { TrendingUp, Mail, Calendar, Users, RefreshCw, Zap, Target, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export default function Analytics() {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        label: 'Last 30 days'
    });
    const [autoRefresh, setAutoRefresh] = useState(false);

    const { data: campaignStats, refetch: refetchCampaigns } = useQuery({
        queryKey: ['campaign-analytics', dateRange],
        queryFn: () => api.getCampaignAnalytics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        }).then(res => res.data)
    });

    const { data: meetingStats, refetch: refetchMeetings } = useQuery({
        queryKey: ['meeting-analytics', dateRange],
        queryFn: () => api.getMeetingAnalytics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        }).then(res => res.data)
    });

    const { data: leadsStats, refetch: refetchLeads } = useQuery({
        queryKey: ['leads-analytics', dateRange],
        queryFn: () => api.getLeadsAnalytics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        }).then(res => res.data)
    });

    const { data: trendsData } = useQuery({
        queryKey: ['trends-analytics', dateRange],
        queryFn: () => api.getTrendsAnalytics({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        }).then(res => res.data)
    });

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            refetchCampaigns();
            refetchMeetings();
            refetchLeads();
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, refetchCampaigns, refetchMeetings, refetchLeads]);

    const handleRefresh = () => {
        refetchCampaigns();
        refetchMeetings();
        refetchLeads();
    };

    // Prepare chart data
    const campaignTrendData = {
        labels: trendsData?.data?.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
        datasets: [
            {
                label: 'Open Rate %',
                data: trendsData?.data?.map(d => parseFloat(d.openRate)) || [],
                borderColor: chartColors.purple.border,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    return chartColors.purple.gradient(ctx);
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Click Rate %',
                data: trendsData?.data?.map(d => parseFloat(d.clickRate)) || [],
                borderColor: chartColors.pink.border,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    return chartColors.pink.gradient(ctx);
                },
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    const campaignPerformanceData = {
        labels: campaignStats?.data?.slice(0, 10)?.map(c => c.name.slice(0, 20)) || [],
        datasets: [
            {
                label: 'Open Rate %',
                data: campaignStats?.data?.slice(0, 10)?.map(c => parseFloat(c.openRate)) || [],
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderRadius: 8,
                borderSkipped: false
            },
            {
                label: 'Click Rate %',
                data: campaignStats?.data?.slice(0, 10)?.map(c => parseFloat(c.clickRate)) || [],
                backgroundColor: 'rgba(236, 72, 153, 0.8)',
                borderRadius: 8,
                borderSkipped: false
            }
        ]
    };

    const meetingDistributionData = {
        labels: ['Completed', 'Scheduled', 'Cancelled', 'No-Show'],
        datasets: [
            {
                data: [
                    meetingStats?.stats?.completed || 0,
                    meetingStats?.stats?.upcoming || 0,
                    meetingStats?.stats?.cancelled || 0,
                    meetingStats?.stats?.noShows || 0
                ],
                backgroundColor: COLORS,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 10
            }
        ]
    };

    const leadsComparisonData = {
        labels: ['Recruiter Leads', 'Student Leads'],
        datasets: [
            {
                label: 'Total Leads',
                data: [
                    leadsStats?.byType?.recruiter?.recordsSaved || 0,
                    leadsStats?.byType?.student?.recordsSaved || 0
                ],
                backgroundColor: ['rgba(139, 92, 246, 0.8)', 'rgba(59, 130, 246, 0.8)'],
                borderRadius: 8
            }
        ]
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Analytics Dashboard
                        </h1>
                        <p className="text-slate-600 mt-1">Track performance across all metrics in real-time</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DateRangePicker
                            onRangeChange={setDateRange}
                            selectedRange={dateRange.label}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={autoRefresh ? 'border-purple-300 bg-purple-50' : ''}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                            {autoRefresh ? 'Auto-Refreshing' : 'Auto-Refresh'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <ExportAllButton
                            campaignData={campaignStats?.data}
                            meetingData={meetingStats?.stats}
                            leadsData={leadsStats?.summary}
                        />
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        icon={Mail}
                        title="Avg Open Rate"
                        value={`${campaignStats?.summary?.avgOpenRate || '0'}%`}
                        trend="+12%"
                        trendUp={true}
                        color="purple"
                        subtitle="from last period"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        title="Avg Click Rate"
                        value={`${campaignStats?.summary?.avgClickRate || '0'}%`}
                        trend="+8%"
                        trendUp={true}
                        color="pink"
                        subtitle="from last period"
                    />
                    <MetricCard
                        icon={Calendar}
                        title="Meeting Rate"
                        value={`${meetingStats?.stats?.completionRate || '0'}%`}
                        trend="+15%"
                        trendUp={true}
                        color="blue"
                        subtitle="completion rate"
                    />
                    <MetricCard
                        icon={Users}
                        title="Email Templates"
                        value={(leadsStats?.summary?.totalEmailTemplates || 0).toLocaleString()}
                        trend="+5"
                        trendUp={true}
                        color="green"
                        subtitle="stored in database"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Trends */}
                    <LineChartCard
                        title="Campaign Performance Trends"
                        data={campaignTrendData}
                        exportFilename="campaign-trends"
                        options={{
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    ticks: {
                                        callback: function (value) {
                                            return value + '%';
                                        }
                                    }
                                }
                            }
                        }}
                    />

                    {/* Meeting Distribution */}
                    <DoughnutChartCard
                        title="Meeting Distribution"
                        data={meetingDistributionData}
                        exportFilename="meeting-distribution"
                        options={{
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }}
                    />
                </div>

                {/* Secondary Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Performance Comparison */}
                    <BarChartCard
                        title="Top 10 Campaigns Performance"
                        data={campaignPerformanceData}
                        exportFilename="campaign-performance"
                        options={{
                            indexAxis: 'y',
                            scales: {
                                x: {
                                    beginAtZero: true,
                                    max: 100,
                                    ticks: {
                                        callback: function (value) {
                                            return value + '%';
                                        }
                                    }
                                }
                            }
                        }}
                    />

                    {/* CSV Upload Stats */}
                    <BarChartCard
                        title="CSV Leads Distribution"
                        data={leadsComparisonData}
                        exportFilename="leads-comparison"
                        options={{
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }}
                    />
                </div>

                {/* Detailed Stats Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Details */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Campaign Insights</span>
                                <ExportCSVButton
                                    data={campaignStats?.data}
                                    filename="campaign-insights"
                                    label="Export"
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <StatsRow
                                    label="Total Campaigns"
                                    value={campaignStats?.data?.length || 0}
                                    icon={Target}
                                    color="purple"
                                />
                                <StatsRow
                                    label="Average Open Rate"
                                    value={`${campaignStats?.summary?.avgOpenRate || '0'}%`}
                                    icon={Mail}
                                    color="blue"
                                />
                                <StatsRow
                                    label="Average Click Rate"
                                    value={`${campaignStats?.summary?.avgClickRate || '0'}%`}
                                    icon={Zap}
                                    color="pink"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meeting Details */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Meeting Insights</span>
                                <ExportCSVButton
                                    data={[meetingStats?.stats || {}]}
                                    filename="meeting-insights"
                                    label="Export"
                                />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <StatsRow
                                    label="Total Scheduled"
                                    value={meetingStats?.stats?.totalScheduled || 0}
                                    icon={Calendar}
                                    color="blue"
                                />
                                <StatsRow
                                    label="Completed"
                                    value={meetingStats?.stats?.completed || 0}
                                    icon={TrendingUp}
                                    color="green"
                                />
                                <StatsRow
                                    label="Completion Rate"
                                    value={`${meetingStats?.stats?.completionRate || '0'}%`}
                                    icon={Target}
                                    color="purple"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CSV Upload Statistics */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>CSV Upload Statistics</span>
                            <ExportCSVButton
                                data={[leadsStats?.summary || {}]}
                                filename="leads-statistics"
                                label="Export"
                            />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                <p className="text-sm text-purple-700 font-medium mb-1">Recruiter Leads</p>
                                <p className="text-3xl font-bold text-purple-900">
                                    {leadsStats?.byType?.recruiter?.recordsSaved?.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                <p className="text-sm text-blue-700 font-medium mb-1">Student Leads</p>
                                <p className="text-3xl font-bold text-blue-900">
                                    {leadsStats?.byType?.student?.recordsSaved?.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                <p className="text-sm text-green-700 font-medium mb-1">Email Templates</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {leadsStats?.templates?.total?.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-700 font-medium mb-1">Total Leads</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {leadsStats?.summary?.totalLeads?.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ icon: Icon, title, value, trend, trendUp, color, subtitle }) {
    const colors = {
        purple: {
            gradient: 'from-purple-500 to-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-600'
        },
        pink: {
            gradient: 'from-pink-500 to-pink-600',
            bg: 'bg-pink-50',
            border: 'border-pink-200',
            text: 'text-pink-600'
        },
        blue: {
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-600'
        },
        green: {
            gradient: 'from-green-500 to-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-600'
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 ${colors[color].border}`}>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-slate-600 font-medium mb-2">{title}</p>
                            <p className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                {value}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                                    {trendUp && <ArrowUpRight className="h-4 w-4" />}
                                    {trend}
                                </span>
                                <span className="text-xs text-slate-500">{subtitle}</span>
                            </div>
                        </div>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[color].gradient} flex items-center justify-center shadow-md`}>
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function StatsRow({ label, value, icon: Icon, color }) {
    const colorClasses = {
        purple: 'bg-purple-100 text-purple-600',
        pink: 'bg-pink-100 text-pink-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600'
    };

    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700">{label}</span>
            </div>
            <span className="text-xl font-bold text-slate-900">{value}</span>
        </div>
    );
}
