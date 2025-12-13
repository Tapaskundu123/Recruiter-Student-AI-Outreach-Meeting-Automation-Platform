import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { Mail, Send, Plus, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function CampaignManager() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        targetAudience: 'students',
        subject: '',
        template: ''
    });

    const { data: campaigns, refetch } = useQuery({
        queryKey: ['campaigns'],
        queryFn: () => api.getCampaigns({ page: 1, limit: 20 }).then(res => res.data)
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createCampaign(formData);
            setShowCreateForm(false);
            setFormData({ name: '', targetAudience: 'students', subject: '', template: '' });
            refetch();
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    const sendCampaign = async (id) => {
        try {
            await api.sendCampaign(id);
            refetch();
        } catch (error) {
            console.error('Failed to send campaign:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Email Campaigns</h1>
                        <p className="text-slate-600">Create and manage AI-powered email campaigns</p>
                    </div>
                    <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="gradient">
                        <Plus className="w-4 h-4 mr-2" />
                        New Campaign
                    </Button>
                </div>

                {showCreateForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Campaign</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Campaign Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Spring 2025 Recruitment"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Target Audience</Label>
                                        <select
                                            value={formData.targetAudience}
                                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3"
                                        >
                                            <option value="students">Students</option>
                                            <option value="recruiters">Recruiters</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Email Subject</Label>
                                    <Input
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Exciting opportunities await!"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Email Template</Label>
                                    <textarea
                                        value={formData.template}
                                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                        className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2"
                                        placeholder="Hi {{name}}, ..."
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" variant="gradient">Create Campaign</Button>
                                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>All Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Audience</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead>Open Rate</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns?.data?.map((campaign) => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell className="capitalize">{campaign.targetAudience}</TableCell>
                                        <TableCell>
                                            <Badge variant={campaign.status === 'completed' ? 'success' : 'default'}>
                                                {campaign.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{campaign.sentCount}</TableCell>
                                        <TableCell>
                                            {campaign.sentCount > 0
                                                ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1)
                                                : '0'}%
                                        </TableCell>
                                        <TableCell>
                                            {campaign.status === 'draft' && (
                                                <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                                                    <Send className="w-3 h-3 mr-1" />
                                                    Send
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
