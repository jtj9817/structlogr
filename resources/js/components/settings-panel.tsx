import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { useSettings } from '@/hooks/use-settings';
import {
    ExternalLink,
    Monitor,
    Moon,
    RotateCcw,
    Save,
    Settings,
    Sun,
} from 'lucide-react';

interface SettingsPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
    const { settings, updateSetting, resetSettings } = useSettings();
    const { appearance, updateAppearance } = useAppearance();

    const handleReset = () => {
        if (
            confirm(
                'Are you sure you want to reset all settings to default values?',
            )
        ) {
            resetSettings();
        }
    };

    const handleSave = () => {
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-[720px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Settings
                    </SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="output" className="mt-6">
                    <TabsList className="h-auto w-full flex-wrap gap-2">
                        <TabsTrigger
                            value="output"
                            className="flex-1 min-w-[140px] sm:flex-none"
                        >
                            Output
                        </TabsTrigger>
                        <TabsTrigger
                            value="privacy"
                            className="flex-1 min-w-[140px] sm:flex-none"
                        >
                            Privacy
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className="flex-1 min-w-[140px] sm:flex-none"
                        >
                            Display
                        </TabsTrigger>
                        <TabsTrigger
                            value="advanced"
                            className="flex-1 min-w-[140px] sm:flex-none"
                        >
                            Advanced
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="output" className="mt-6">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-lg font-medium">
                                Output Format
                            </h3>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {/* Default Output Format */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="output-format">
                                            Default Output Format
                                        </Label>
                                        <Select
                                            value={settings.outputFormat}
                                            onValueChange={(
                                                value: 'json' | 'table' | 'cards',
                                            ) =>
                                                updateSetting(
                                                    'outputFormat',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger id="output-format">
                                                <SelectValue placeholder="Select output format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="json">
                                                    JSON
                                                </SelectItem>
                                                <SelectItem value="table">
                                                    Table
                                                </SelectItem>
                                                <SelectItem value="cards">
                                                    Cards
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Choose the default format for displaying
                                        formatted logs
                                    </p>
                                </section>

                                {/* JSON Indentation */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <Label className="font-medium">
                                        JSON Indentation
                                    </Label>
                                    <RadioGroup
                                        className="grid gap-3 sm:grid-cols-3"
                                        value={settings.jsonIndentation.toString()}
                                        onValueChange={(value: string) => {
                                            if (value === 'tab') {
                                                updateSetting(
                                                    'jsonIndentation',
                                                    'tab',
                                                );
                                            } else {
                                                updateSetting(
                                                    'jsonIndentation',
                                                    parseInt(value) as 2 | 4,
                                                );
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="2"
                                                id="indent-2"
                                            />
                                            <Label htmlFor="indent-2">
                                                2 spaces
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="4"
                                                id="indent-4"
                                            />
                                            <Label htmlFor="indent-4">
                                                4 spaces
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="tab"
                                                id="indent-tab"
                                            />
                                            <Label htmlFor="indent-tab">
                                                Tabs
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </section>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {/* Auto-copy Results */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="auto-copy">
                                            Auto-copy Results
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Automatically copy formatted results
                                            to clipboard
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto-copy"
                                        checked={settings.autoCopyResults}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'autoCopyResults',
                                                checked,
                                            )
                                        }
                                    />
                                </section>

                                {/* Show Line Numbers */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="show-line-numbers">
                                            Show Line Numbers
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Display line numbers in JSON output
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-line-numbers"
                                        checked={settings.showLineNumbers}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'showLineNumbers',
                                                checked,
                                            )
                                        }
                                    />
                                </section>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="privacy" className="mt-6">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-lg font-medium">
                                Privacy Settings
                            </h3>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {/* Save to History */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="save-history">
                                            Save to History
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Keep a history of your formatted
                                            logs locally
                                        </p>
                                    </div>
                                    <Switch
                                        id="save-history"
                                        checked={settings.saveToHistory}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'saveToHistory',
                                                checked,
                                            )
                                        }
                                    />
                                </section>

                                {/* Anonymous Analytics */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="analytics">
                                            Anonymous Usage Analytics
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Help improve StructLogr with
                                            anonymous usage data
                                        </p>
                                    </div>
                                    <Switch
                                        id="analytics"
                                        checked={settings.anonymousAnalytics}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'anonymousAnalytics',
                                                checked,
                                            )
                                        }
                                    />
                                </section>

                                {/* Don't Store Sensitive Data */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="avoid-sensitive">
                                            Avoid Storing Sensitive Data
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Don't save logs that may contain
                                            sensitive information
                                        </p>
                                    </div>
                                    <Switch
                                        id="avoid-sensitive"
                                        checked={settings.avoidSensitiveStorage}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'avoidSensitiveStorage',
                                                checked,
                                            )
                                        }
                                    />
                                </section>

                                <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 lg:col-span-2">
                                    <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                                        Privacy Notice
                                    </h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        All settings are stored locally in your
                                        browser. We don't collect or store your
                                        log data on our servers unless you
                                        explicitly choose to save it.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="display" className="mt-6">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-lg font-medium">
                                Display Preferences
                            </h3>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {/* Theme */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
                                    <Label className="font-medium">Theme</Label>
                                    <RadioGroup
                                        className="grid gap-3 sm:grid-cols-3"
                                        value={appearance}
                                        onValueChange={(
                                            value: 'light' | 'dark' | 'system',
                                        ) => updateAppearance(value)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="light"
                                                id="theme-light"
                                            />
                                            <Label
                                                htmlFor="theme-light"
                                                className="flex items-center gap-2"
                                            >
                                                <Sun className="h-4 w-4" />
                                                Light
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="dark"
                                                id="theme-dark"
                                            />
                                            <Label
                                                htmlFor="theme-dark"
                                                className="flex items-center gap-2"
                                            >
                                                <Moon className="h-4 w-4" />
                                                Dark
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value="system"
                                                id="theme-system"
                                            />
                                            <Label
                                                htmlFor="theme-system"
                                                className="flex items-center gap-2"
                                            >
                                                <Monitor className="h-4 w-4" />
                                                System
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Choose your preferred color theme
                                    </p>
                                </section>

                                {/* Font Size */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="font-size">
                                            Font Size
                                        </Label>
                                        <Select
                                            value={settings.fontSize}
                                            onValueChange={(
                                                value: 'small' | 'medium' | 'large',
                                            ) =>
                                                updateSetting(
                                                    'fontSize',
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger id="font-size">
                                                <SelectValue placeholder="Select font size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">
                                                    Small
                                                </SelectItem>
                                                <SelectItem value="medium">
                                                    Medium
                                                </SelectItem>
                                                <SelectItem value="large">
                                                    Large
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Adjust the text size throughout the
                                        application
                                    </p>
                                </section>

                                {/* Reduce Animations */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="reduce-animations">
                                            Reduce Animations
                                        </Label>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Minimize motion and animations for
                                            better accessibility
                                        </p>
                                    </div>
                                    <Switch
                                        id="reduce-animations"
                                        checked={settings.reduceAnimations}
                                        onCheckedChange={(checked: boolean) =>
                                            updateSetting(
                                                'reduceAnimations',
                                                checked,
                                            )
                                        }
                                    />
                                </section>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="mt-6">
                        <div className="flex flex-col gap-6">
                            <h3 className="text-lg font-medium">
                                Advanced Configuration
                            </h3>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {/* Custom API Endpoint */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="custom-endpoint">
                                            Custom API Endpoint
                                        </Label>
                                        <Input
                                            id="custom-endpoint"
                                            type="url"
                                            placeholder="https://api.example.com/format"
                                            value={settings.customApiEndpoint}
                                            onChange={(e) =>
                                                updateSetting(
                                                    'customApiEndpoint',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        For self-hosted or custom API endpoints
                                    </p>
                                    {settings.customApiEndpoint && (
                                        <Badge
                                            variant="secondary"
                                            className="w-fit text-xs"
                                        >
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            Custom endpoint active
                                        </Badge>
                                    )}
                                </section>

                                {/* API Key */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="api-key">API Key</Label>
                                        <Input
                                            id="api-key"
                                            type="password"
                                            placeholder="Enter your API key"
                                            value={settings.apiKey}
                                            onChange={(e) =>
                                                updateSetting(
                                                    'apiKey',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        API key for authentication with custom
                                        endpoints
                                    </p>
                                </section>

                                {/* Timeout Duration */}
                                <section className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="timeout">
                                            Timeout Duration (seconds)
                                        </Label>
                                        <Input
                                            id="timeout"
                                            type="number"
                                            min="5"
                                            max="120"
                                            value={settings.timeoutSeconds}
                                            onChange={(e) => {
                                                const value = parseInt(
                                                    e.target.value,
                                                );
                                                if (!isNaN(value)) {
                                                    updateSetting(
                                                        'timeoutSeconds',
                                                        value,
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Maximum time to wait for API response
                                        (5-120 seconds)
                                    </p>
                                </section>

                                <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30 lg:col-span-2">
                                    <h4 className="mb-2 font-medium text-amber-900 dark:text-amber-100">
                                        Advanced Settings
                                    </h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        These settings are intended for advanced
                                        users and self-hosted deployments.
                                        Incorrect configuration may cause the
                                        application to malfunction.
                                    </p>
                                </section>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset to Defaults
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Settings
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
