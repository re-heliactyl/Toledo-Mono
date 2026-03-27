import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Database
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

export default function AdminUpdater() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    enabled: true,
    checkInterval: 30,
    webhookSecret: '',
    maxBackups: 3
  });

  // Fetch config
  const { data: config, isLoading: configLoading, error: configError } = useQuery({
    queryKey: ['admin-updater-config'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/updater/config');
      return data;
    }
  });

  // Sync form data when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        enabled: config.enabled,
        checkInterval: config.checkInterval,
        webhookSecret: config.webhookSecret,
        maxBackups: config.maxBackups
      });
    }
  }, [config]);

  // Fetch status
  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useQuery({
    queryKey: ['admin-updater-status'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/updater/status');
      return data;
    },
    refetchInterval: 30000, // Refresh every 30s
    retry: 2
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const { data: result } = await axios.post('/api/admin/updater/config', formData);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-updater-config']);
      toast({
        title: 'Configuration saved',
        description: 'Updater settings have been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save configuration',
        variant: 'destructive',
      });
    }
  });

  // Trigger update mutation
  const triggerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/admin/updater/trigger');
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Update triggered',
        description: 'Checking for updates...',
        variant: 'default',
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to trigger update',
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      checkInterval: parseInt(formData.checkInterval) || 60,
      maxBackups: parseInt(formData.maxBackups) || 1
    };
    saveMutation.mutate(dataToSave);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (configLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load updater configuration. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">System Updater</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Manage automatic updates and version control for your Heliactyl instance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status?.upToDate ? "default" : "secondary"} className={status?.upToDate ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"}>
              {status?.upToDate ? "System Up to Date" : "Update Available"}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="bg-[#111111] border border-neutral-800">
            <TabsTrigger value="status" className="data-[state=active]:bg-neutral-800">
              <RefreshCw className="w-4 h-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-neutral-800">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Version Information</CardTitle>
                  <CardDescription>Current system version status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-neutral-800">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-400">Current Version</p>
                      <p className="text-2xl font-bold text-white">{status?.currentVersion || 'Unknown'}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-neutral-800">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-400">Latest Version</p>
                      <p className="text-2xl font-bold text-white">{status?.latestVersion || 'Checking...'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {status?.updating ? (
                         <Badge variant="outline" className="animate-pulse border-blue-500 text-blue-500">
                           Updating...
                         </Badge>
                      ) : status?.upToDate ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          Latest
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          Outdated
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ConfirmDialog
                    trigger={
                      <Button 
                        className="w-full" 
                        disabled={triggerMutation.isPending || status?.updating}
                      >
                        {triggerMutation.isPending || status?.updating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            {status?.updating ? "Update in Progress..." : "Checking..."}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Check for Updates
                          </>
                        )}
                      </Button>
                    }
                    title="Confirm System Update"
                    description="This will check for updates and automatically apply them if available. Your server might restart during this process. Are you sure you want to proceed?"
                    confirmText="Check and Update"
                    cancelText="Cancel"
                    onConfirm={() => triggerMutation.mutate()}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Overview of updater components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-900 transition-colors">
                    <div className={`p-2 rounded-full ${config?.enabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Auto-Update</p>
                      <p className="text-sm text-neutral-400">
                        {config?.enabled ? `Checking every ${config.checkInterval} minutes` : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-900 transition-colors">
                    <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Backup Retention</p>
                      <p className="text-sm text-neutral-400">
                        Keeping last {config?.maxBackups || 3} backups
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Updater Configuration</CardTitle>
                <CardDescription>Configure automatic update behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg border border-neutral-800">
                  <div className="space-y-0.5">
                    <Label className="text-base">Automatic Updates</Label>
                    <p className="text-sm text-neutral-400">
                      Enable automatic checking and applying of updates
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Check Interval (Minutes)</Label>
                    <Input
                      type="number"
                      value={formData.checkInterval}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, checkInterval: val === '' ? '' : parseInt(val) });
                      }}
                      min={5}
                    />
                    <p className="text-xs text-neutral-500">
                      How often to check for new updates
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Backups</Label>
                    <Input
                      type="number"
                      value={formData.maxBackups}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, maxBackups: val === '' ? '' : parseInt(val) });
                      }}
                      min={1}
                    />
                    <p className="text-xs text-neutral-500">
                      Number of previous versions to keep
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={formData.webhookSecret}
                      onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-neutral-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Secret key for validating update webhooks
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <ConfirmDialog
                    trigger={
                      <Button 
                        disabled={saveMutation.isPending}
                      >
                        {saveMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Configuration
                          </>
                        )}
                      </Button>
                    }
                    title="Save Configuration"
                    description="Are you sure you want to save these updater settings? Incorrect settings might prevent automatic updates from working."
                    confirmText="Save Changes"
                    cancelText="Cancel"
                    onConfirm={handleSave}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
