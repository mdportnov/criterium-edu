import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { settingsService, type AppSettings } from '@/services/settings.service';
import { Eye, EyeOff } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({});

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
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
    const newValue =
      settings?.data.registration_enabled === 'true' ? 'false' : 'true';
    updateSettingsMutation.mutate({ registration_enabled: newValue });
  };

  const handleApiKeyChange = (value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      openai_api_key: value,
    }));
  };

  const handleSave = () => {
    if (Object.keys(localSettings).length > 0) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const hasChanges = Object.keys(localSettings).length > 0;
  const registrationEnabled =
    localSettings.registration_enabled ??
    settings?.data.registration_enabled === 'true';
  const apiKeyValue =
    localSettings.openai_api_key ?? settings?.data.openai_api_key ?? '';

  if (isLoading) {
    return (
      <Card>
        <LoadingState label="Loading settings…" />
      </Card>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load settings"
        message="The admin service did not respond."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Registration</CardTitle>
              <CardDescription>
                Control whether new users can register for accounts.
              </CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-muted-foreground">
                {registrationEnabled
                  ? 'Users can create new accounts.'
                  : 'Registration is disabled.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleRegistration}
              >
                {registrationEnabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>LLM configuration</CardTitle>
              <CardDescription>
                Configure the OpenAI API key used by AI-powered features.
              </CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent>
            <Field
              label="OpenAI API key"
              htmlFor="openai-api-key"
              hint="Required for AI-powered code analysis and review features."
            >
              <div className="relative">
                <Input
                  id="openai-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyValue}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-…"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showApiKey ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  <span className="sr-only">
                    {showApiKey ? 'Hide API key' : 'Show API key'}
                  </span>
                </button>
              </div>
            </Field>
          </CardContent>
          {hasChanges && (
            <CardFooter className="justify-end">
              <Button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {updateSettingsMutation.isSuccess && (
        <Alert variant="success">
          <AlertDescription>
            Settings have been updated successfully.
          </AlertDescription>
        </Alert>
      )}

      {updateSettingsMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to update settings. Please try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { SettingsTab };
