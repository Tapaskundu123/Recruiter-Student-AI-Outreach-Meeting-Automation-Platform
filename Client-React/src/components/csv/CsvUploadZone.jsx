import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, Loader2, FileText, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CsvUploadZone = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [recordType, setRecordType] = useState('recruiter');
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Validate file extension
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast.error('Invalid file type', {
                description: 'Please upload a CSV file'
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('recordType', recordType);

        setUploading(true);
        setUploadProgress(0);

        try {
            const res = await axios.post(`${API_BASE_URL}/csv/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            toast.success('CSV uploaded successfully!', {
                description: `Processing ${file.name} in background...`
            });

            if (onUploadSuccess) onUploadSuccess(res.data.upload);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed', {
                description: error.response?.data?.error || error.message
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [recordType, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        maxFiles: 1,
        disabled: uploading,
        multiple: false
    });

    return (
        <Card className="overflow-hidden">
            <div className="p-6">
                {/* Record Type Selection */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Select Data Type
                    </label>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant={recordType === 'recruiter' ? 'default' : 'outline'}
                            onClick={() => setRecordType('recruiter')}
                            disabled={uploading}
                            className={recordType === 'recruiter' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Recruiter CSV
                        </Button>
                        <Button
                            type="button"
                            variant={recordType === 'student' ? 'default' : 'outline'}
                            onClick={() => setRecordType('student')}
                            disabled={uploading}
                            className={recordType === 'student' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Student CSV
                        </Button>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${isDragActive
                            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                        }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />

                    {uploading ? (
                        <div className="space-y-4">
                            <Loader2 className="w-16 h-16 mx-auto animate-spin text-indigo-600" />
                            <div>
                                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                                <p className="text-sm text-gray-500 mt-1">{uploadProgress}% complete</p>
                            </div>
                            {/* Progress Bar */}
                            <div className="max-w-md mx-auto">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                {isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here'}
                            </p>
                            <p className="text-sm text-gray-500 mb-1">or click to browse</p>
                            <p className="text-xs text-gray-400 mt-4">
                                Upload <span className="font-medium text-indigo-600">{recordType}</span> data • Max 10MB • CSV format only
                            </p>
                        </div>
                    )}
                </div>

                {/* Template Download Links */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">📋 Need a template?</p>
                    <div className="flex gap-3">
                        <a
                            href="/templates/recruiter-template.csv"
                            download
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Download Recruiter Template
                        </a>
                        <span className="text-gray-400">•</span>
                        <a
                            href="/templates/student-template.csv"
                            download
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Download Student Template
                        </a>
                    </div>
                </div>

                {/* CSV Format Help */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        {recordType === 'recruiter' ? 'Recruiter' : 'Student'} CSV Format:
                    </p>
                    <div className="text-xs text-gray-600 space-y-1">
                        {recordType === 'recruiter' ? (
                            <>
                                <p><span className="font-medium">Required:</span> name, email</p>
                                <p><span className="font-medium">Optional:</span> company, jobTitle, linkedIn, country, field</p>
                            </>
                        ) : (
                            <>
                                <p><span className="font-medium">Required:</span> name, email</p>
                                <p><span className="font-medium">Optional:</span> phone, university, major, graduationYear, country, degree</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CsvUploadZone;
