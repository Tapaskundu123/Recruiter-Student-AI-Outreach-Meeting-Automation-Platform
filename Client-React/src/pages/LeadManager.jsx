import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { api } from '../lib/api';
import { Users, UserCheck, Search, Download, Trash2, Filter, ChevronLeft, ChevronRight, MoreHorizontal, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import EmailComposer from '../components/EmailComposer';

export default function LeadManager() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState('recruiters');

    // Filters
    const [countryFilter, setCountryFilter] = useState('all');
    const [fieldFilter, setFieldFilter] = useState('all'); // Recruiters only
    const [platformFilter, setPlatformFilter] = useState('all');

    // Selection
    const [selectedRecruiters, setSelectedRecruiters] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    // Email Composer
    const [showEmailComposer, setShowEmailComposer] = useState(false);

    // --- RECRUITERS QUERY ---
    const { data: recruitersData, isLoading: isLoadingRecruiters } = useQuery({
        queryKey: ['recruiters', page, searchQuery, countryFilter, fieldFilter, platformFilter],
        queryFn: () => api.getRecruiters({
            page,
            limit: 50,
            search: searchQuery,
            country: countryFilter !== 'all' ? countryFilter : undefined,
            field: fieldFilter !== 'all' ? fieldFilter : undefined,
            platform: platformFilter !== 'all' ? platformFilter : undefined
        }).then(res => res.data),
        keepPreviousData: true
    });

    // --- STUDENTS QUERY ---
    const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['students', page, searchQuery, countryFilter, platformFilter], // No field filter for students (major?)
        queryFn: () => api.getStudents({
            page,
            limit: 50,
            search: searchQuery,
            country: countryFilter !== 'all' ? countryFilter : undefined,
            platform: platformFilter !== 'all' ? platformFilter : undefined
        }).then(res => res.data),
        keepPreviousData: true
    });

    // --- MUTATIONS ---
    const deleteRecruiterMutation = useMutation({
        mutationFn: api.deleteRecruiter,
        onSuccess: () => {
            toast.success("Recruiter deleted");
            queryClient.invalidateQueries(['recruiters']);
            setSelectedRecruiters([]);
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: api.deleteStudent,
        onSuccess: () => {
            toast.success("Student deleted");
            queryClient.invalidateQueries(['students']);
            setSelectedStudents([]);
        }
    });

    // --- HANDLERS ---

    // Bulk Export
    const handleExport = async () => {
        try {
            toast.loading("Exporting...");
            if (activeTab === 'recruiters') {
                const response = await api.exportRecruiters({ ids: selectedRecruiters, format: 'json' }); // Using JSON for now as CSV logic was placeholder
                // Handle Blob download
                const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data)]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'recruiters_export.json'); // or .csv
                document.body.appendChild(link);
                link.click();
            } else {
                const response = await api.exportStudents({ ids: selectedStudents, format: 'json' });
                const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data)]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'students_export.json');
                document.body.appendChild(link);
                link.click();
            }
            toast.dismiss();
            toast.success("Export successful");
        } catch (err) {
            toast.dismiss();
            toast.error("Export failed");
        }
    };

    // Bulk Delete
    const handleBulkDelete = async () => {
        if (!confirm("Are you sure you want to delete selected records?")) return;

        if (activeTab === 'recruiters') {
            await Promise.all(selectedRecruiters.map(id => deleteRecruiterMutation.mutateAsync(id)));
        } else {
            await Promise.all(selectedStudents.map(id => deleteStudentMutation.mutateAsync(id)));
        }
    };

    // Selection Logic
    const toggleSelectAll = (checked, data) => {
        if (activeTab === 'recruiters') {
            if (checked) {
                setSelectedRecruiters(data.map(r => r.id));
            } else {
                setSelectedRecruiters([]);
            }
        } else {
            if (checked) {
                setSelectedStudents(data.map(s => s.id));
            } else {
                setSelectedStudents([]);
            }
        }
    };

    const toggleSelectOne = (id, selectedIds, setSelectedIds) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // --- RENDER HELPERS ---
    const renderPagination = (pagination) => {
        if (!pagination) return null;
        return (
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Lead Database</h1>
                        <p className="text-slate-600">Manage and convert your leads</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {((activeTab === 'recruiters' && selectedRecruiters.length > 0) || (activeTab === 'students' && selectedStudents.length > 0)) && (
                            <div className="flex bg-slate-100 rounded-md p-1 items-center gap-2 mr-4 animate-in fade-in slide-in-from-right-4">
                                <span className="text-sm font-medium px-2">
                                    {activeTab === 'recruiters' ? selectedRecruiters.length : selectedStudents.length} selected
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700" 
                                    onClick={() => setShowEmailComposer(true)}
                                >
                                    <Mail className="w-4 h-4 mr-1" /> Send Email
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleBulkDelete}>
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleExport}>
                                    <Download className="w-4 h-4 mr-1" /> Export
                                </Button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Filters Bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name, email, company..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={countryFilter} onValueChange={setCountryFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Countries</SelectItem>
                                    <SelectItem value="USA">USA</SelectItem>
                                    <SelectItem value="India">India</SelectItem>
                                    <SelectItem value="UK">UK</SelectItem>
                                    <SelectItem value="Canada">Canada</SelectItem>
                                </SelectContent>
                            </Select>

                            {activeTab === 'recruiters' && (
                                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Fields</SelectItem>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Platforms</SelectItem>
                                    <SelectItem value="GitHub">GitHub</SelectItem>
                                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                    <SelectItem value="Indeed">Indeed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="recruiters" className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4" /> Recruiters
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs ml-1">
                                {recruitersData?.pagination?.total || 0}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="students" className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Students
                            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs ml-1">
                                {studentsData?.pagination?.total || 0}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recruiters">
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={recruitersData?.data?.length > 0 && selectedRecruiters.length === recruitersData?.data?.length}
                                                    onCheckedChange={(c) => toggleSelectAll(c, recruitersData?.data || [])}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Field</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>Platform</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recruitersData?.data?.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedRecruiters.includes(r.id)}
                                                        onCheckedChange={() => toggleSelectOne(r.id, selectedRecruiters, setSelectedRecruiters)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{r.name}</div>
                                                    <div className="text-xs text-slate-500">{r.email}</div>
                                                </TableCell>
                                                <TableCell>{r.company}</TableCell>
                                                <TableCell>{r.field}</TableCell>
                                                <TableCell>{r.country}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {r.platform || 'General'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="px-4 border-t">
                                    {renderPagination(recruitersData?.pagination)}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students">
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={studentsData?.data?.length > 0 && selectedStudents.length === studentsData?.data?.length}
                                                    onCheckedChange={(c) => toggleSelectAll(c, studentsData?.data || [])}
                                                />
                                            </TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>University</TableHead>
                                            <TableHead>Degree</TableHead>
                                            <TableHead>Country</TableHead>
                                            <TableHead>Platform</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsData?.data?.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedStudents.includes(s.id)}
                                                        onCheckedChange={() => toggleSelectOne(s.id, selectedStudents, setSelectedStudents)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{s.name}</div>
                                                    <div className="text-xs text-slate-500">{s.email}</div>
                                                </TableCell>
                                                <TableCell>{s.university}</TableCell>
                                                <TableCell>{s.degree || s.major}</TableCell>
                                                <TableCell>{s.country}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                        {s.platform || 'General'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="px-4 border-t">
                                    {renderPagination(studentsData?.pagination)}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Email Composer Modal */}
            {showEmailComposer && (
                <EmailComposer
                    recipients={[
                        // Add recruiters
                        ...recruitersData?.data
                            ?.filter(r => selectedRecruiters.includes(r.id))
                            .map(r => ({
                                id: r.id,
                                type: 'recruiter',
                                name: r.name,
                                email: r.email,
                                company: r.company
                            })) || [],
                        // Add students
                        ...studentsData?.data
                            ?.filter(s => selectedStudents.includes(s.id))
                            .map(s => ({
                                id: s.id,
                                type: 'student',
                                name: s.name,
                                email: s.email,
                                university: s.university
                            })) || []
                    ]}
                    onClose={() => setShowEmailComposer(false)}
                />
            )}
        </DashboardLayout>
    );
}
