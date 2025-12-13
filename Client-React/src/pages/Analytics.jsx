import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Mail, Calendar, Users } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'];

export default function Analytics() {
    const { data: campaignStats } = useQuery({
        queryKey: ['campaign-analytics'],
        queryFn: () => api.getCampaignAnalytics().then(res => res.data)
    });

    const { data: meetingStats } = useQuery({
        queryKey: ['meeting-analytics'],
        queryFn: () => api.getMeetingAnalytics().then(res => res.data)
    });

    const { data: scrapingStats } = useQuery({
        queryKey: ['scraping-analytics'],
        queryFn: () => api.getScrapingAnalytics().then(res => res.data)
    });

    // Mock data for charts
    const emailPerformance = campaignStats?.data?.slice(0, 6)?.map(c => ({
        name: c.name.slice(0, 15),
        openRate: parseFloat(c.openRate),
        clickRate: parseFloat(c.clickRate)
    })) || [];

    const meetingData = [
        { name: 'Completed', value: meetingStats?.stats?.completed || 0 },
        { name: 'Scheduled', value: meetingStats?.stats?.upcoming || 0 },
        { name: 'Cancelled', value: meetingStats?.stats?.cancelled || 0 },
        { name: 'No-Show', value: meetingStats?.stats?.noShows || 0 }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                    <p className="text-slate-600">Track performance across all metrics</p>
                </div>

                {/* Overview Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                    <MetricCard
                        icon={Mail}
                        title="Avg Open Rate"
                        value={`${campaignStats?.summary?.avgOpenRate || '0'}%`}
                        trend="+12%"
                        color="purple"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        title="Avg Click Rate"
                        value={`${campaignStats?.summary?.avgClickRate || '0'}%`}
                        trend="+8%"
                        color="pink"
                    />
                    <MetricCard
                        icon={Calendar}
                        title="Meeting Rate"
                        value={`${meetingStats?.stats?.completionRate || '0'}%`}
                        trend="+15%"
                        color="blue"
                    />
                    <MetricCard
                        icon={Users}
                        title="Total Leads"
                        value={(scrapingStats?.summary?.totalRecordsSaved || 0).toLocaleString()}
                        trend="+156"
                        color="green"
                    />
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Campaign Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={emailPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="openRate" fill="#8b5cf6" name="Open Rate %" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="clickRate" fill="#ec4899" name="Click Rate %" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Meeting Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={meetingData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {meetingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Scraping Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scraping Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                                    <span className="font-medium">Recruiter Records</span>
                                    <span className="text-2xl font-bold text-purple-600">
                                        {scrapingStats?.byType?.recruiter?.recordsSaved?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                    <span className="font-medium">Student Records</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {scrapingStats?.byType?.student?.recordsSaved?.toLocaleString() || '0'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                                    <span className="font-medium">Success Rate</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {scrapingStats?.summary?.completed
                                            ? ((scrapingStats.summary.completed / scrapingStats.summary.total) * 100).toFixed(1)
                                            : '0'}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                                    <span className="font-medium">Total Jobs</span>
                                    <span className="text-2xl font-bold">
                                        {scrapingStats?.summary?.total || '0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

function MetricCard({ icon: Icon, title, value, trend, color }) {
    const colors = {
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600'
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-600 mb-1">{title}</p>
                        <p className="text-3xl font-bold mb-2">{value}</p>
                        <p className="text-sm text-green-600">{trend} from last month</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
