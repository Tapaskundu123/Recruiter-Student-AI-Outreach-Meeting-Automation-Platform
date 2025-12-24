import { saveAs } from 'file-saver';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '../ui/button';

// Convert data to CSV
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                const stringValue = typeof value === 'string'
                    ? `"${value.replace(/"/g, '""')}"`
                    : value;
                return stringValue;
            }).join(',')
        )
    ];

    return csvRows.join('\n');
};

export function ExportCSVButton({ data, filename = 'analytics-data', label = 'Export CSV' }) {
    const handleExport = () => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${filename}.csv`);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data || data.length === 0}
        >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}

export function ExportAllButton({ campaignData, meetingData, scrapingData }) {
    const handleExportAll = () => {
        const allData = {
            campaigns: campaignData || [],
            meetings: meetingData || [],
            scraping: scrapingData || []
        };

        // Create a summary CSV
        const summaryData = [
            {
                metric: 'Total Campaigns',
                value: campaignData?.length || 0
            },
            {
                metric: 'Total Meetings',
                value: meetingData?.totalScheduled || 0
            },
            {
                metric: 'Completed Meetings',
                value: meetingData?.completed || 0
            },
            {
                metric: 'Total Records Scraped',
                value: scrapingData?.totalRecordsSaved || 0
            }
        ];

        const csv = convertToCSV(summaryData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `analytics-summary-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <Button
            variant="default"
            size="sm"
            onClick={handleExportAll}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
            <FileDown className="mr-2 h-4 w-4" />
            Export All Data
        </Button>
    );
}
