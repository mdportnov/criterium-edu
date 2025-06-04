import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { promptsService } from '../../../services';
import type { Prompt, CreatePromptDto, UpdatePromptDto, PromptType } from '../../../types';

const PROMPT_TYPES = [
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
];

export const PromptsTab: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CreatePromptDto>({
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
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promptsData, categoriesData] = await Promise.all([
        promptsService.getAllPrompts(),
        promptsService.getAvailableCategories(),
      ]);
      setPrompts(promptsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load prompts data:', error);
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
    } catch (error) {
      console.error('Failed to create prompt:', error);
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
      
      const updatedPrompt = await promptsService.updatePrompt(selectedPrompt.id, updateData);
      setPrompts(prompts.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
      setSelectedPrompt(updatedPrompt);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await promptsService.deletePrompt(promptId);
      setPrompts(prompts.filter(p => p.id !== promptId));
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const resetForm = () => {
    setFormData({
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
    });
  };

  const startEdit = (prompt: Prompt) => {
    setFormData({
      key: prompt.key,
      name: prompt.name,
      description: prompt.description || '',
      category: prompt.category,
      promptType: prompt.promptType,
      defaultLanguage: prompt.defaultLanguage,
      variables: prompt.variables,
      translations: LANGUAGES.map(lang => ({
        languageCode: lang.value,
        content: prompt.translations.find(t => t.languageCode === lang.value)?.content || '',
      })),
    });
    setSelectedPrompt(prompt);
    setIsEditing(true);
  };

  const updateFormTranslation = (languageCode: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      translations: prev.translations.map(t =>
        t.languageCode === languageCode ? { ...t, content } : t
      ),
    }));
  };

  if (loading) {
    return <div className="p-4">Loading prompts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Prompts Management</h3>
        <Button onClick={() => setIsCreating(true)}>Create New Prompt</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">All Prompts ({prompts.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className={`cursor-pointer transition-colors ${
                  selectedPrompt?.id === prompt.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPrompt(prompt)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{prompt.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">Key: {prompt.key}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{prompt.category}</Badge>
                        <Badge variant="outline">{prompt.promptType}</Badge>
                        {!prompt.isActive && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(prompt);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          {selectedPrompt && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedPrompt.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Key</Label>
                    <p className="text-sm">{selectedPrompt.key}</p>
                  </div>
                  {selectedPrompt.description && (
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm">{selectedPrompt.description}</p>
                    </div>
                  )}
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm">{selectedPrompt.category}</p>
                  </div>
                  <div>
                    <Label>Variables</Label>
                    <div className="flex gap-1 flex-wrap">
                      {selectedPrompt.variables.map((variable) => (
                        <Badge key={variable} variant="outline">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Translations</Label>
                    <Tabs defaultValue="en" className="mt-2">
                      <TabsList>
                        {selectedPrompt.translations.map((translation) => (
                          <TabsTrigger key={translation.languageCode} value={translation.languageCode}>
                            {LANGUAGES.find(l => l.value === translation.languageCode)?.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {selectedPrompt.translations.map((translation) => (
                        <TabsContent key={translation.languageCode} value={translation.languageCode}>
                          <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                            {translation.content}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(isCreating || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle>{isCreating ? 'Create New Prompt' : 'Edit Prompt'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key">Key *</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      disabled={isEditing}
                      placeholder="e.g., task_review_system"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Human-readable name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., task_review, solution_analysis"
                    />
                  </div>

                  <div>
                    <Label htmlFor="variables">Variables (comma-separated)</Label>
                    <Input
                      id="variables"
                      value={formData.variables.join(', ')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                      })}
                      placeholder="task_title, solution_code, criteria"
                    />
                  </div>

                  <div>
                    <Label>Translations</Label>
                    <Tabs defaultValue="en" className="mt-2">
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
                            value={formData.translations.find(t => t.languageCode === lang.value)?.content || ''}
                            onChange={(e) => updateFormTranslation(lang.value, e.target.value)}
                            placeholder={`Enter prompt content in ${lang.label}...`}
                            rows={8}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={isCreating ? handleCreatePrompt : handleUpdatePrompt}
                      disabled={saving || !formData.key || !formData.name}
                    >
                      {saving ? 'Saving...' : isCreating ? 'Create' : 'Update'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};