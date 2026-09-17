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
import {
  LLM_PROVIDERS,
  settingsService,
  type AppSettings,
} from '@/services/settings.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const setSetting = (key: keyof AppSettings, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const valueOf = (key: keyof AppSettings) =>
    localSettings[key] ?? settings?.data[key] ?? '';

  const handleSave = () => {
    if (Object.keys(localSettings).length > 0) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const hasChanges = Object.keys(localSettings).length > 0;
  const registrationEnabled =
    localSettings.registration_enabled ??
    settings?.data.registration_enabled === 'true';
  const provider = valueOf('llm_provider') || 'openai';

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
              <CardTitle>Language model</CardTitle>
              <CardDescription>
                Where assessment and review calls go. Every provider here speaks
                the same protocol, so switching is a key and a model name.
              </CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Provider" htmlFor="llm-provider">
              <Select
                value={provider}
                onValueChange={(value) => setSetting('llm_provider', value)}
              >
                <SelectTrigger id="llm-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="API key"
              htmlFor="llm-api-key"
              hint="Stored encrypted. Leave the mask untouched to keep the current key."
            >
              <div className="relative">
                <Input
                  id="llm-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={valueOf('llm_api_key')}
                  onChange={(e) => setSetting('llm_api_key', e.target.value)}
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

            <Field
              label="Model"
              htmlFor="llm-model"
              hint="Blank uses the provider's default."
            >
              <Input
                id="llm-model"
                value={valueOf('llm_model')}
                onChange={(e) => setSetting('llm_model', e.target.value)}
                placeholder="deepseek/deepseek-chat"
              />
            </Field>

            {provider === 'custom' && (
              <Field
                label="Base URL"
                htmlFor="llm-base-url"
                hint="Required for a custom provider; overrides the default otherwise."
              >
                <Input
                  id="llm-base-url"
                  value={valueOf('llm_base_url')}
                  onChange={(e) => setSetting('llm_base_url', e.target.value)}
                  placeholder="https://api.example.com/v1"
                />
              </Field>
            )}

            <Field
              label="Price overrides"
              htmlFor="llm-pricing"
              hint='USD per million tokens, as JSON: {"model": {"prompt": 0.27, "completion": 1.1}}. Needed for providers whose catalogue we cannot ship, such as OpenRouter; without it a run records tokens at zero cost.'
            >
              <Input
                id="llm-pricing"
                value={valueOf('llm_pricing')}
                onChange={(e) => setSetting('llm_pricing', e.target.value)}
                placeholder='{"deepseek/deepseek-chat":{"prompt":0.27,"completion":1.1}}'
              />
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
