import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import {
  Activity,
  BarChart3,
  DollarSign,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import { UsersTab } from '../components/UsersTab';
import { AuditLogsTab } from '../components/AuditLogsTab';
import { SettingsTab } from '../components/SettingsTab';
import { PromptsTab } from '../components/PromptsTab';
import { CostsTab } from '../components/CostsTab';

const AdminPanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Manage users and monitor system activity across the platform."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="size-4" />
            Activity logs
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <MessageSquare className="size-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="size-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="size-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Shield className="size-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="activity">
          <AuditLogsTab />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptsTab />
        </TabsContent>

        <TabsContent value="costs">
          <CostsTab />
        </TabsContent>

        <TabsContent value="stats">
          <div className="rounded-md border border-border bg-card px-6 py-10 text-center text-[13px] text-muted-foreground">
            Statistics dashboard coming soon.
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelPage;
