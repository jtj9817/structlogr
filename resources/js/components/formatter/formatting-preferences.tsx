import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { usePreferences } from '@/hooks/use-preferences';
import type { LLMModel } from '@/types/preferences';
import { Settings } from 'lucide-react';

interface FormattingPreferencesProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FormattingPreferences({
    open,
    onOpenChange,
}: FormattingPreferencesProps) {
    const { preferences, updatePreference, resetPreferences } =
        usePreferences();

    const handleReset = () => {
        if (
            confirm(
                'Are you sure you want to reset all preferences to default values?',
            )
        ) {
            resetPreferences();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Formatting Preferences
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Include Metadata */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="include-metadata">
                                Include Metadata
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Show additional metadata fields in the output
                            </p>
                        </div>
                        <Toggle
                            id="include-metadata"
                            pressed={preferences.includeMetadata}
                            onPressedChange={(pressed) =>
                                updatePreference('includeMetadata', pressed)
                            }
                        />
                    </div>

                    {/* Parse Timestamps */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="parse-timestamps">
                                Parse Timestamps
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Convert timestamps to standardized format
                            </p>
                        </div>
                        <Toggle
                            id="parse-timestamps"
                            pressed={preferences.parseTimestamps}
                            onPressedChange={(pressed) =>
                                updatePreference('parseTimestamps', pressed)
                            }
                        />
                    </div>

                    {/* Normalize Log Levels */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="normalize-levels">
                                Normalize Log Levels
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Convert log levels to standard uppercase format
                            </p>
                        </div>
                        <Toggle
                            id="normalize-levels"
                            pressed={preferences.normalizeLogLevels}
                            onPressedChange={(pressed) =>
                                updatePreference('normalizeLogLevels', pressed)
                            }
                        />
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                            value={preferences.timezone}
                            onValueChange={(value) =>
                                updatePreference('timezone', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC">UTC</SelectItem>
                                <SelectItem value="Local">
                                    Local Time
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Convert timestamps to selected timezone
                        </p>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-2">
                        <Label htmlFor="date-format">Date Format</Label>
                        <Select
                            value={preferences.dateFormat}
                            onValueChange={(
                                value: 'ISO8601' | 'Unix' | 'Custom',
                            ) => updatePreference('dateFormat', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ISO8601">
                                    ISO 8601 (2025-01-15T10:30:00Z)
                                </SelectItem>
                                <SelectItem value="Unix">
                                    Unix Timestamp (1706789400)
                                </SelectItem>
                                <SelectItem value="Custom">
                                    Custom Format
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Standard format for timestamp output
                        </p>
                    </div>

                    {/* LLM Model */}
                    <div className="space-y-2">
                        <Label htmlFor="llm-model">LLM Model Used</Label>
                        <Select
                            value={preferences.llmModel}
                            onValueChange={(value: LLMModel) =>
                                updatePreference('llmModel', value)
                            }
                        >
                            <SelectTrigger id="llm-model">
                                <SelectValue placeholder="Select LLM model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="deepseek-chat">
                                    DeepSeek Chat (Default)
                                </SelectItem>
                                <SelectItem value="gemini-2.5-flash">
                                    Gemini 2.5 Flash
                                </SelectItem>
                                <SelectItem value="kimi-k2-turbo-preview">
                                    Kimi K2 Turbo Preview
                                </SelectItem>
                                <SelectItem value="GLM-4.5-Air">
                                    GLM-4.5-Air
                                </SelectItem>
                                <SelectItem value="GLM-4.6">
                                    GLM-4.6
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose which language model processes your logs
                        </p>
                    </div>
                </div>

                <div className="flex justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                    <Button variant="outline" onClick={handleReset}>
                        Reset to Defaults
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
