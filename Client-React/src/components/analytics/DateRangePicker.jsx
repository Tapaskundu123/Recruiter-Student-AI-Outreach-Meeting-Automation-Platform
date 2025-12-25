import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';

const presetRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 }
];

export default function DateRangePicker({ onRangeChange, selectedRange = 'Last 30 days' }) {
    const [currentRange, setCurrentRange] = useState(selectedRange);

    const handleRangeSelect = (label, days) => {
        setCurrentRange(label);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        onRangeChange({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            label
        });
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {currentRange}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 space-y-1">
                    {presetRanges.map((range) => (
                        <Button
                            key={range.label}
                            variant={currentRange === range.label ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => handleRangeSelect(range.label, range.days)}
                        >
                            {range.label}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
