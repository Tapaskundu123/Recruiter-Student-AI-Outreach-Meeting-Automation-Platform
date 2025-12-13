import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { Calendar as CalendarIcon, Video, Clock, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function MeetingScheduler() {
    const { data: meetings } = useQuery({
        queryKey: ['meetings'],
        queryFn: () => api.getMeetings({ page: 1, limit: 20 }).then(res => res.data)
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Meetings</h1>
                        <p className="text-slate-600">View and manage scheduled meetings</p>
                    </div>
                    <Button variant="gradient">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule Meeting
                    </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-purple-600">
                                    {meetings?.data?.filter(m => m.status === 'scheduled').length || 0}
                                </p>
                                <p className="text-slate-600 mt-1">Scheduled</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-green-600">
                                    {meetings?.data?.filter(m => m.status === 'completed').length || 0}
                                </p>
                                <p className="text-slate-600 mt-1">Completed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-blue-600">
                                    {meetings?.data?.length || 0}
                                </p>
                                <p className="text-slate-600 mt-1">Total Meetings</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Meetings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Scheduled Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {meetings?.data?.map((meeting) => (
                                    <TableRow key={meeting.id}>
                                        <TableCell className="font-medium">{meeting.title}</TableCell>
                                        <TableCell className="text-sm">
                                            <div>{meeting.recruiter?.name}</div>
                                            <div className="text-slate-500">{meeting.student?.name}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(meeting.scheduledTime).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{meeting.duration} min</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    meeting.status === 'completed' ? 'success' :
                                                        meeting.status === 'cancelled' ? 'destructive' :
                                                            'default'
                                                }
                                            >
                                                {meeting.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {meeting.googleMeetLink && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <a href={meeting.googleMeetLink} target="_blank" rel="noopener noreferrer">
                                                        <Video className="w-3 h-3 mr-1" />
                                                        Join
                                                    </a>
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
