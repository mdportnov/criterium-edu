import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Shield, BarChart3, MessageSquare, DollarSign } from 'lucide-react';
import { UsersTab } from '../components/UsersTab';
import { AuditLogsTab } from '../components/AuditLogsTab';
import { SettingsTab } from '../components/SettingsTab';
import { PromptsTab } from '../components/PromptsTab';
import { CostsTab } from '../components/CostsTab';

const AdminPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container-responsive py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          <Shield className="w-8 h-8 inline-block mr-3 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Manage users and monitor system activity across the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1">
          <TabsTrigger value="users" className="flex items-center gap-2 py-3 cursor-pointer">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2 py-3 cursor-pointer">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity Logs</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2 py-3 cursor-pointer">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2 py-3 cursor-pointer">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Costs</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2 py-3 cursor-pointer">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Statistics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 py-3 cursor-pointer">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage all registered users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                User Activity Logs
              </CardTitle>
              <CardDescription>
                Monitor all user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                AI Prompts Management
              </CardTitle>
              <CardDescription>
                Configure AI prompts with multi-language support for various system operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Cost Analytics
              </CardTitle>
              <CardDescription>
                Monitor API usage costs and analyze spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                System Statistics
              </CardTitle>
              <CardDescription>
                Overview of system performance and usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Statistics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Admin Settings
              </CardTitle>
              <CardDescription>
                Configure system settings and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelPage;