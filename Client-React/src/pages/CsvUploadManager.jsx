import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
    Upload,
    FileText,
    CheckCircle,
    XCircle,
    Download,
    Trash2,
    Loader2,
    Eye,
    RotateCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import CsvUploadZone from '@/components/csv/CsvUploadZone';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CsvUploadManager = () => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all'); // all, recruiter, student
    const [selectedUpload, setSelectedUpload] = useState(null);

    // Fetch uploads
    const { data: uploadsData, isLoading } = useQuery({
        queryKey: ['csv-uploads', filter],
        queryFn: async () => {
            const params = filter !== 'all' ? `?recordType=${filter}` : '';
            const res = await axios.get(`${API_BASE_URL}/csv/uploads${params}`);
            return res.data;
        },
        refetchInterval: 5000 // Refresh every 5 seconds to catch processing updates
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['csv-stats'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE_URL}/csv/stats`);
            return res.data;
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await axios.delete(`${API_BASE_URL}/csv/uploads/${id}`);
        },
        onSuccess: () => {
            toast.success('CSV deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['csv-uploads'] });
            queryClient.invalidateQueries({ queryKey: ['csv-stats'] });
        },
        onError: (error) => {
            toast.error('Failed to delete CSV', {
                description: error.response?.data?.error
            });
        }
    });

    // Reprocess mutation
    const reprocessMutation = useMutation({
        mutationFn: async (id) => {
            await axios.post(`${API_BASE_URL}/csv/uploads/${id}/reprocess`);
        },
        onSuccess: () => {
            toast.success('CSV reprocessing started');
            queryClient.invalidateQueries({ queryKey: ['csv-uploads'] });
        },
        onError: (error) => {
            toast.error('Failed to reprocess CSV', {
                description: error.response?.data?.error
            });
        }
    });

    const getStatusBadge = (status) => {
        const variants = {
            completed: {
                className: 'bg-green-100 text-green-700 border-green-200',
                icon: CheckCircle
            },
            processing: {
                className: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: Loader2
            },
            pending: {
                className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: FileText
            },
            failed: {
                className: 'bg-red-100 text-red-700 border-red-200',
                icon: XCircle
            }
        };

        const { className, icon: Icon } = variants[status] || variants.pending;

        return (
            <Badge className={`flex items-center gap-1 border ${className}`}>
                <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
                {status}
            </Badge>
        );
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">CSV Upload Manager</h1>
                <p className="text-gray-500 mt-1">Upload and manage recruiter and student data via CSV files</p>
            </div>

            {/* Stats Cards */}
            {statsData?.stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold text-indigo-600">{statsData.stats.totalUploads}</div>
                            <div className="text-sm text-gray-500">Total Uploads</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold text-green-600">{statsData.stats.completedUploads}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold text-blue-600">{statsData.stats.totalRecordsProcessed}</div>
                            <div className="text-sm text-gray-500">Records Processed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold text-red-600">{statsData.stats.failedUploads}</div>
                            <div className="text-sm text-gray-500">Failed</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Upload Zone */}
            <CsvUploadZone
                onUploadSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['csv-uploads'] });
                    queryClient.invalidateQueries({ queryKey: ['csv-stats'] });
                }}
            />

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'recruiter', 'student'].map((filterType) => (
                    <Button
                        key={filterType}
                        variant={filter === filterType ? 'default' : 'outline'}
                        onClick={() => setFilter(filterType)}
                        className={filter === filterType ? 'bg-indigo-600' : ''}
                    >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </Button>
                ))}
            </div>

            {/* Uploads List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : uploadsData?.uploads?.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">No CSV uploads yet</p>
                            <p className="text-sm text-gray-400 mt-2">Upload your first CSV file to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    uploadsData?.uploads?.map((upload) => (
                        <Card key={upload.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg truncate">{upload.originalName}</h3>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                                    <span>Uploaded {formatDate(upload.uploadedAt)}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(upload.fileSize)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Type</p>
                                                <p className="font-medium capitalize mt-1">{upload.recordType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Status</p>
                                                <div className="mt-1">{getStatusBadge(upload.status)}</div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Total</p>
                                                <p className="font-medium mt-1">{upload.totalRecords}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Success</p>
                                                <p className="font-medium text-green-600 mt-1">{upload.successCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Errors</p>
                                                <p className="font-medium text-red-600 mt-1">{upload.errorCount}</p>
                                            </div>
                                        </div>

                                        {upload.errorCount > 0 && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-sm text-red-700">
                                                    ⚠️ {upload.errorCount} row{upload.errorCount > 1 ? 's' : ''} failed validation
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                window.open(`${API_BASE_URL}/csv/uploads/${upload.id}/download`, '_blank');
                                            }}
                                            title="Download CSV"
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>

                                        {upload.status === 'failed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => reprocessMutation.mutate(upload.id)}
                                                disabled={reprocessMutation.isPending}
                                                title="Reprocess"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </Button>
                                        )}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(upload.id)}
                                            disabled={deleteMutation.isPending}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Pagination */}
            {uploadsData?.pagination && uploadsData.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    {Array.from({ length: uploadsData.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={page === uploadsData.pagination.page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                // Handle pagination
                            }}
                        >
                            {page}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CsvUploadManager;
