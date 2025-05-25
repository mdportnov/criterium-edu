import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { settingsService, type AppSettings } from '@/services/settings.service';
import { Settings, Save, Eye, EyeOff, ToggleLeft, ToggleRight } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({});

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setLocalSettings({});
    },
  });

  const handleToggleRegistration = () => {
    const newValue = settings?.data.registration_enabled === 'true' ? 'false' : 'true';
    updateSettingsMutation.mutate({ registration_enabled: newValue });
  };

  const handleApiKeyChange = (value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      openai_api_key: value
    }));
  };

  const handleSave = () => {
    if (Object.keys(localSettings).length > 0) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const hasChanges = Object.keys(localSettings).length > 0;
  const registrationEnabled = localSettings.registration_enabled ?? settings?.data.registration_enabled === 'true';
  const apiKeyValue = localSettings.openai_api_key ?? settings?.data.openai_api_key ?? '';

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading settings...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        Failed to load settings. Please try again.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Registration Settings
            </CardTitle>
            <CardDescription>
              Control whether new users can register for accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">User Registration</Label>
                <p className="text-sm text-muted-foreground">
                  {registrationEnabled ? 'Users can create new accounts' : 'Registration is disabled'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleRegistration}
                className="p-1"
              >
                {registrationEnabled ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              LLM Configuration
            </CardTitle>
            <CardDescription>
              Configure OpenAI API settings for AI-powered features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-api-key">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  id="openai-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyValue}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Required for AI-powered code analysis and review features
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {updateSettingsMutation.isSuccess && (
        <Alert>
          Settings have been updated successfully.
        </Alert>
      )}

      {updateSettingsMutation.isError && (
        <Alert variant="destructive">
          Failed to update settings. Please try again.
        </Alert>
      )}
    </div>
  );
};

export { SettingsTab };