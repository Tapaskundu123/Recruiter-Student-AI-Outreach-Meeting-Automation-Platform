import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { api } from '../lib/api';
import { Play, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function ScrapingMonitor() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['scraping-logs'],
        queryFn: () => api.getScrapingLogs({ page: 1, limit: 20 }).then(res => res.data)
    });

    const startScraping = async (type) => {
        try {
            if (type === 'recruiter') {
                await api.startRecruiterScraping({
                    target: 'https://linkedin.com',
                    countries: ['USA', 'Canada'],
                    fields: ['Technology', 'Finance']
                });
            } else {
                await api.startStudentScraping({
                    target: 'https://university.edu',
                    countries: ['USA']
                });
            }
        } catch (error) {
            console.error('Failed to start scraping:', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Scraping Monitor</h1>
                        <p className="text-slate-600">Monitor and control web scraping jobs</p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => startScraping('recruiter')} variant="gradient">
                            <Play className="w-4 h-4 mr-2" />
                            Scrape Recruiters
                        </Button>
                        <Button onClick={() => startScraping('student')} variant="outline">
                            <Database className="w-4 h-4 mr-2" />
                            Scrape Students
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Scraping Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Target</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Found</TableHead>
                                        <TableHead>Saved</TableHead>
                                        <TableHead>Started</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs?.data?.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium capitalize">{log.jobType}</TableCell>
                                            <TableCell className="text-sm text-slate-600">{log.target}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.status === 'completed' ? 'success' : log.status === 'running' ? 'default' : 'destructive'}>
                                                    {log.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {log.status === 'running' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                                                    {log.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.recordsFound}</TableCell>
                                            <TableCell>{log.recordsSaved}</TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {new Date(log.startedAt).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
