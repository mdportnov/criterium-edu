import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field, Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus } from 'lucide-react';
import { promptsService } from '@/services';
import type {
  Prompt,
  CreatePromptDto,
  UpdatePromptDto,
  PromptType,
} from '@/types';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
];

const emptyForm: CreatePromptDto = {
  key: '',
  name: '',
  description: '',
  category: '',
  promptType: 'system' as PromptType,
  defaultLanguage: 'en',
  variables: [],
  translations: [
    { languageCode: 'en', content: '' },
    { languageCode: 'ru', content: '' },
  ],
};

export const PromptsTab: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreatePromptDto>(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const promptsData = await promptsService.getAllPrompts();
      setPrompts(promptsData);
    } catch (err) {
      console.error('Failed to load prompts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrompt = async () => {
    try {
      setSaving(true);
      const newPrompt = await promptsService.createPrompt(formData);
      setPrompts([...prompts, newPrompt]);
      setIsCreating(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      setSaving(true);
      const updateData: UpdatePromptDto = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        promptType: formData.promptType,
        defaultLanguage: formData.defaultLanguage,
        variables: formData.variables,
        translations: formData.translations,
      };

      const updatedPrompt = await promptsService.updatePrompt(
        selectedPrompt.id,
        updateData,
      );
      setPrompts(
        prompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p)),
      );
      setSelectedPrompt(updatedPrompt);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update prompt:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Delete this prompt? This cannot be undone.')) return;

    try {
      await promptsService.deletePrompt(promptId);
      setPrompts(prompts.filter((p) => p.id !== promptId));
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
      }
    } catch (err) {
      console.error('Failed to delete prompt:', err);
    }
  };

  const resetForm = () => setFormData(emptyForm);

  const startEdit = (prompt: Prompt) => {
    setFormData({
      key: prompt.key,
      name: prompt.name,
      description: prompt.description || '',
      category: prompt.category,
      promptType: prompt.promptType,
      defaultLanguage: prompt.defaultLanguage,
      variables: prompt.variables,
      translations: LANGUAGES.map((lang) => ({
        languageCode: lang.value,
        content:
          prompt.translations.find((t) => t.languageCode === lang.value)
            ?.content || '',
      })),
    });
    setSelectedPrompt(prompt);
    setIsEditing(true);
  };

  const updateFormTranslation = (languageCode: string, content: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations.map((t) =>
        t.languageCode === languageCode ? { ...t, content } : t,
      ),
    }));
  };

  if (loading) {
    return (
      <Card>
        <LoadingState label="Loading prompts…" />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Prompts ({prompts.length})</CardTitle>
          </CardHeaderText>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                setIsCreating(true);
                setIsEditing(false);
                setSelectedPrompt(null);
                resetForm();
              }}
            >
              <Plus className="size-4" />
              New prompt
            </Button>
          </CardAction>
        </CardHeader>

        {prompts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No prompts yet"
            description="Prompts configure the AI-powered review and analysis features."
          />
        ) : (
          <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className={cn(
                    'flex w-full flex-col items-start gap-1.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/50',
                    selectedPrompt?.id === prompt.id &&
                      !isCreating &&
                      !isEditing &&
                      'bg-muted/60',
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {prompt.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {prompt.key}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(prompt);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-soft hover:text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge>{prompt.category}</Badge>
                    <Badge variant="outline">{prompt.promptType}</Badge>
                    {!prompt.isActive && (
                      <Badge variant="danger">Inactive</Badge>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        {selectedPrompt && !isEditing && !isCreating && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>{selectedPrompt.name}</CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Key</Label>
                <p className="mt-1 text-[13px] text-foreground">
                  {selectedPrompt.key}
                </p>
              </div>
              {selectedPrompt.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-[13px] text-foreground">
                    {selectedPrompt.description}
                  </p>
                </div>
              )}
              <div>
                <Label>Category</Label>
                <p className="mt-1 text-[13px] text-foreground">
                  {selectedPrompt.category}
                </p>
              </div>
              <div>
                <Label>Variables</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedPrompt.variables.length ? (
                    selectedPrompt.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <Label>Translations</Label>
                <Tabs defaultValue="en" className="mt-1.5">
                  <TabsList>
                    {selectedPrompt.translations.map((translation) => (
                      <TabsTrigger
                        key={translation.languageCode}
                        value={translation.languageCode}
                      >
                        {
                          LANGUAGES.find(
                            (l) => l.value === translation.languageCode,
                          )?.label
                        }
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedPrompt.translations.map((translation) => (
                    <TabsContent
                      key={translation.languageCode}
                      value={translation.languageCode}
                    >
                      <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-[13px] leading-5 text-foreground">
                        {translation.content}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        )}

        {(isCreating || isEditing) && (
          <Card>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>
                  {isCreating ? 'New prompt' : 'Edit prompt'}
                </CardTitle>
              </CardHeaderText>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Key" htmlFor="key" required>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  disabled={isEditing}
                  placeholder="e.g. task_review_system"
                />
              </Field>

              <Field label="Name" htmlFor="name" required>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Human-readable name"
                />
              </Field>

              <Field label="Description" htmlFor="description">
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </Field>

              <Field label="Category" htmlFor="category" required>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. task_review, solution_analysis"
                />
              </Field>

              <Field
                label="Variables"
                htmlFor="variables"
                hint="Comma-separated"
              >
                <Input
                  id="variables"
                  value={formData.variables.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variables: e.target.value
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="task_title, solution_code, criteria"
                />
              </Field>

              <div className="space-y-1.5">
                <Label>Translations</Label>
                <Tabs defaultValue="en">
                  <TabsList>
                    {LANGUAGES.map((lang) => (
                      <TabsTrigger key={lang.value} value={lang.value}>
                        {lang.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {LANGUAGES.map((lang) => (
                    <TabsContent key={lang.value} value={lang.value}>
                      <Textarea
                        value={
                          formData.translations.find(
                            (t) => t.languageCode === lang.value,
                          )?.content || ''
                        }
                        onChange={(e) =>
                          updateFormTranslation(lang.value, e.target.value)
                        }
                        placeholder={`Enter prompt content in ${lang.label}…`}
                        rows={8}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={isCreating ? handleCreatePrompt : handleUpdatePrompt}
                disabled={saving || !formData.key || !formData.name}
              >
                {saving ? 'Saving…' : isCreating ? 'Create' : 'Update'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        )}

        {!selectedPrompt && !isCreating && !isEditing && (
          <Card>
            <EmptyState
              icon={MessageSquare}
              title="No prompt selected"
              description="Pick a prompt from the list to view its content, or create a new one."
            />
          </Card>
        )}
      </div>
    </div>
  );
};
