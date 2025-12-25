import { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale
);

// Common chart options
export const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                font: {
                    family: 'Inter, system-ui, sans-serif',
                    size: 12
                },
                color: '#64748b',
                usePointStyle: true,
                padding: 15
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: '#475569',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
                size: 13,
                weight: '600'
            },
            bodyFont: {
                size: 12
            }
        }
    },
    interaction: {
        mode: 'index',
        intersect: false
    }
};

// Export chart as PNG
export const exportChartAsPNG = (chartRef, filename = 'chart') => {
    if (chartRef.current) {
        const url = chartRef.current.toBase64Image();
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = url;
        link.click();
    }
};

// Line Chart Card Component
export function LineChartCard({ title, data, options = {}, showExport = true, exportFilename = 'line-chart' }) {
    const chartRef = useRef(null);

    const mergedOptions = {
        ...commonOptions,
        ...options,
        plugins: {
            ...commonOptions.plugins,
            ...options.plugins
        }
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {showExport && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportChartAsPNG(chartRef, exportFilename)}
                        className="h-8 w-8 p-0"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-80">
                    <Line ref={chartRef} data={data} options={mergedOptions} />
                </div>
            </CardContent>
        </Card>
    );
}

// Doughnut Chart Card Component
export function DoughnutChartCard({ title, data, options = {}, showExport = true, exportFilename = 'doughnut-chart' }) {
    const chartRef = useRef(null);

    const mergedOptions = {
        ...commonOptions,
        ...options,
        plugins: {
            ...commonOptions.plugins,
            ...options.plugins,
            legend: {
                ...commonOptions.plugins.legend,
                position: 'bottom'
            }
        }
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {showExport && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportChartAsPNG(chartRef, exportFilename)}
                        className="h-8 w-8 p-0"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-80 flex items-center justify-center">
                    <Doughnut ref={chartRef} data={data} options={mergedOptions} />
                </div>
            </CardContent>
        </Card>
    );
}

// Bar Chart Card Component
export function BarChartCard({ title, data, options = {}, showExport = true, exportFilename = 'bar-chart' }) {
    const chartRef = useRef(null);

    const mergedOptions = {
        ...commonOptions,
        ...options,
        plugins: {
            ...commonOptions.plugins,
            ...options.plugins
        }
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                {showExport && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportChartAsPNG(chartRef, exportFilename)}
                        className="h-8 w-8 p-0"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-80">
                    <Bar ref={chartRef} data={data} options={mergedOptions} />
                </div>
            </CardContent>
        </Card>
    );
}

// Gradient colors for charts
export const chartColors = {
    purple: {
        background: 'rgba(139, 92, 246, 0.1)',
        border: 'rgb(139, 92, 246)',
        gradient: (ctx) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
            return gradient;
        }
    },
    pink: {
        background: 'rgba(236, 72, 153, 0.1)',
        border: 'rgb(236, 72, 153)',
        gradient: (ctx) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
            gradient.addColorStop(1, 'rgba(236, 72, 153, 0.0)');
            return gradient;
        }
    },
    blue: {
        background: 'rgba(59, 130, 246, 0.1)',
        border: 'rgb(59, 130, 246)',
        gradient: (ctx) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
            return gradient;
        }
    },
    green: {
        background: 'rgba(16, 185, 129, 0.1)',
        border: 'rgb(16, 185, 129)',
        gradient: (ctx) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
            return gradient;
        }
    },
    orange: {
        background: 'rgba(251, 146, 60, 0.1)',
        border: 'rgb(251, 146, 60)',
        gradient: (ctx) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
            gradient.addColorStop(1, 'rgba(251, 146, 60, 0.0)');
            return gradient;
        }
    }
};
