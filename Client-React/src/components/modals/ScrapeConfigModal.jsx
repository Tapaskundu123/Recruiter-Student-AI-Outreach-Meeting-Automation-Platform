import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { PlayCircle, Loader2 } from 'lucide-react';

const COUNTRIES = [
    { value: 'USA', label: 'United States' },
    { value: 'Canada', label: 'Canada' },
    { value: 'Australia', label: 'Australia' }
];

const FIELDS = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
    { value: 'Interior Design', label: 'Interior Design' }
];

const PLATFORMS = [
    { value: 'github', label: 'GitHub', description: 'Tech profiles via API' },
    { value: 'indeed', label: 'Indeed', description: 'Job board recruiters' },
    { value: 'glassdoor', label: 'Glassdoor', description: 'Company recruiters' },
    { value: 'universities', label: 'Universities', description: 'Student directories' }
];

export default function ScrapeConfigModal({ open, onOpenChange, onStartScraping }) {
    const [selectedCountries, setSelectedCountries] = useState(['USA', 'Canada', 'Australia']);
    const [selectedFields, setSelectedFields] = useState(['Computer Science', 'Data Science']);
    const [selectedPlatforms, setSelectedPlatforms] = useState(['github', 'indeed', 'universities']);
    const [isLoading, setIsLoading] = useState(false);

    const toggleCountry = (country) => {
        setSelectedCountries(prev =>
            prev.includes(country)
                ? prev.filter(c => c !== country)
                : [...prev, country]
        );
    };

    const toggleField = (field) => {
        setSelectedFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const togglePlatform = (platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleStartScraping = async () => {
        if (selectedCountries.length === 0 || selectedPlatforms.length === 0) {
            alert('Please select at least one country and one platform');
            return;
        }

        setIsLoading(true);
        try {
            await onStartScraping({
                countries: selectedCountries,
                fields: selectedFields,
                platforms: selectedPlatforms
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to start scraping:', error);
            alert('Failed to start scraping job');
        } finally {
            setIsLoading(false);
        }
    };

    const estimatedRecords = selectedPlatforms.length * selectedCountries.length * 50;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Configure Scraping Job</DialogTitle>
                    <DialogDescription>
                        Select countries, fields, and platforms to scrape data from
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Countries */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Target Countries</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {COUNTRIES.map((country) => (
                                <div
                                    key={country.value}
                                    onClick={() => toggleCountry(country.value)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedCountries.includes(country.value)
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={selectedCountries.includes(country.value)} />
                                        <span className="font-medium">{country.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fields */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Fields of Study/Work</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {FIELDS.map((field) => (
                                <div
                                    key={field.value}
                                    onClick={() => toggleField(field.value)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedFields.includes(field.value)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={selectedFields.includes(field.value)} />
                                        <span className="font-medium text-sm">{field.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Platforms */}
                    <div>
                        <Label className="text-base font-semibold mb-3 block">Data Sources</Label>
                        <div className="space-y-2">
                            {PLATFORMS.map((platform) => (
                                <div
                                    key={platform.value}
                                    onClick={() => togglePlatform(platform.value)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPlatforms.includes(platform.value)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox checked={selectedPlatforms.includes(platform.value)} />
                                            <div>
                                                <p className="font-medium">{platform.label}</p>
                                                <p className="text-sm text-gray-500">{platform.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold mb-2 text-purple-900">Scraping Preview</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Countries:</span>
                                <div className="flex gap-1">
                                    {selectedCountries.map(c => (
                                        <Badge key={c} variant="secondary">{c}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Fields:</span>
                                <div className="flex gap-1 flex-wrap">
                                    {selectedFields.map(f => (
                                        <Badge key={f} variant="secondary">{f}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">Platforms:</span>
                                <div className="flex gap-1">
                                    {selectedPlatforms.map(p => (
                                        <Badge key={p} variant="secondary">{p}</Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-200">
                                <span className="text-purple-900 font-semibold">
                                    Estimated: ~{estimatedRecords}+ records
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartScraping}
                        disabled={isLoading || selectedCountries.length === 0 || selectedPlatforms.length === 0}
                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Start Scraping
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
