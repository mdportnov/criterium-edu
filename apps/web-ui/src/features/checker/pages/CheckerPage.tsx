import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { AlertCircle, CheckCircle, Code, Play } from 'lucide-react';
import { CheckerService } from '@/services/checker.service';
import type { CheckResult, CodeLanguage, CodeTemplate } from '@/types/checker';

const CheckerPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('');
  const [template, setTemplate] = useState<string>('');
  const [languages, setLanguages] = useState<CodeLanguage[]>([]);
  const [templates, setTemplates] = useState<CodeTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CodeTemplate[]>(
    [],
  );
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchLanguagesAndTemplates = async () => {
      try {
        const languagesData = await CheckerService.getSupportedLanguages();
        setLanguages(languagesData);

        if (languagesData.length > 0) {
          setLanguage(languagesData[0].id);
        }

        const templatesData = await CheckerService.getCodeTemplates();
        setTemplates(templatesData);
      } catch (err) {
        console.error('Error fetching languages and templates:', err);
        setError(
          'Failed to load languages and templates. Please try again later.',
        );
      }
    };

    fetchLanguagesAndTemplates();
  }, []);

  useEffect(() => {
    if (language) {
      const filtered = templates.filter((t) => t.languageId === language);
      setFilteredTemplates(filtered);

      if (filtered.length > 0) {
        setTemplate(filtered[0].id);
        setCode(filtered[0].code);
      } else {
        setTemplate('');
        setCode('');
      }
    }
  }, [language, templates]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setResult(null);
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    const selectedTemplate = templates.find((t) => t.id === value);
    if (selectedTemplate) {
      setCode(selectedTemplate.code);
    }
    setResult(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setResult(null);
  };

  const handleRunCheck = async () => {
    if (!code.trim()) {
      setError('Please enter some code to check.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await CheckerService.runCodeCheck({
        code,
        languageId: language,
        templateId: template,
      });

      setResult(result);
    } catch (err) {
      console.error('Error running code check:', err);
      setError('Failed to run code check. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Code Checker</h1>
          <p className="text-muted-foreground mt-1">
            Test your code against predefined test cases and get instant
            feedback
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Code Input
              </CardTitle>
              <CardDescription>
                Write or paste your code below to check it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select
                      value={language}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template</label>
                    <Select
                      value={template}
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTemplates.map((tmpl) => (
                          <SelectItem key={tmpl.id} value={tmpl.id}>
                            {tmpl.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Textarea
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="Enter your code here..."
                    className="font-mono h-96 resize-none border border-input"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleRunCheck}
                disabled={isLoading || !code.trim()}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Check
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Check results will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!result && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Code className="h-12 w-12 mb-4 opacity-50" />
                  <p>Run a check to see results</p>
                </div>
              )}

              {result && (
                <Tabs defaultValue="summary">
                  <TabsList className="w-full">
                    <TabsTrigger value="summary" className="flex-1">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex-1">
                      Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="pt-4">
                    <div className="space-y-4">
                      <div
                        className={`flex items-center p-4 rounded-md ${
                          result.passed
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 mr-2" />
                        )}
                        <span className="font-medium">
                          {result.passed
                            ? 'All tests passed!'
                            : 'Some tests failed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-3">
                          <div className="text-sm text-muted-foreground">
                            Total Tests
                          </div>
                          <div className="text-2xl font-bold">
                            {result.totalTests}
                          </div>
                        </div>
                        <div className="border rounded-md p-3">
                          <div className="text-sm text-muted-foreground">
                            Passed
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {result.passedTests}
                          </div>
                        </div>
                      </div>

                      {!result.passed && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Hint</AlertTitle>
                          <AlertDescription>
                            Check the Details tab for more information about the
                            failed tests.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="pt-4">
                    <div className="space-y-4">
                      {result.testResults.map((test, index) => (
                        <div
                          key={index}
                          className={`border rounded-md p-4 ${
                            test.passed ? 'border-green-200' : 'border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Test #{index + 1}</div>
                            <div
                              className={`text-sm font-medium px-2 py-1 rounded-full ${
                                test.passed
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {test.passed ? 'Passed' : 'Failed'}
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            {test.description}
                          </div>

                          {!test.passed && test.errorMessage && (
                            <div className="mt-2 text-sm bg-red-50 p-2 rounded border border-red-100 text-red-700 font-mono whitespace-pre-wrap">
                              {test.errorMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckerPage;
