import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { api } from '../lib/api';
import { Users, UserCheck, Search, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';

export default function LeadManager() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: recruiters } = useQuery({
        queryKey: ['recruiters', searchQuery],
        queryFn: () => api.getRecruiters({ page: 1, limit: 50, search: searchQuery }).then(res => res.data)
    });

    const { data: students } = useQuery({
        queryKey: ['students', searchQuery],
        queryFn: () => api.getStudents({ page: 1, limit: 50, search: searchQuery }).then(res => res.data)
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Lead Database</h1>
                        <p className="text-slate-600">Manage recruiters and students</p>
                    </div>
                    <Button variant="gradient">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{recruiters?.pagination?.total || 0}</p>
                                    <p className="text-slate-600">Total Recruiters</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{students?.pagination?.total || 0}</p>
                                    <p className="text-slate-600">Total Students</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Lead Database</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search leads..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="recruiters">
                            <TabsList>
                                <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
                                <TabsTrigger value="students">Students</TabsTrigger>
                            </TabsList>

                            <TabsContent value="recruiters" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Country</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recruiters?.data?.map((recruiter) => (
                                            <TableRow key={recruiter.id}>
                                                <TableCell className="font-medium">{recruiter.name}</TableCell>
                                                <TableCell className="text-sm text-slate-600">{recruiter.email}</TableCell>
                                                <TableCell>{recruiter.company || '-'}</TableCell>
                                                <TableCell className="text-sm">{recruiter.jobTitle || '-'}</TableCell>
                                                <TableCell>{recruiter.country || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>

                            <TabsContent value="students" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>University</TableHead>
                                            <TableHead>Major</TableHead>
                                            <TableHead>Grad Year</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students?.data?.map((student) => (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell className="text-sm text-slate-600">{student.email}</TableCell>
                                                <TableCell>{student.university || '-'}</TableCell>
                                                <TableCell className="text-sm">{student.major || '-'}</TableCell>
                                                <TableCell>{student.graduationYear || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
