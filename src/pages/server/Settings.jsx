import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Settings, Save, RefreshCw, AlignLeft, Variable, PowerOff,
  Server, AlertTriangle, CheckCircle2, Terminal, Loader2, LogOut,
  Trash2, AlertCircle, X
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { showApiErrorToast } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverName, setServerName] = useState('');
  const [editedVariables, setEditedVariables] = useState({});
  const [editedStartup, setEditedStartup] = useState({
    command: '',
    image: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Fetch server details
  const { data: serverData, isLoading: isLoadingServer } = useQuery({
    queryKey: ['server', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/server/${id}`);
      setServerName(data.attributes.name);
      setEditedStartup(prev => ({
        ...prev,
        command: data.attributes.invocation || '',
        image: data.attributes.docker_image || ''
      }));
      return data;
    }
  });

  // Fetch startup variables
  const { data: startupData, isLoading: isLoadingStartup } = useQuery({
    queryKey: ['server', id, 'startup'],
    queryFn: async () => {
      const { data } = await axios.get(`/api/server/${id}/variables`);
      return data;
    }
  });

  // Update variables mutation
  const updateVariables = useMutation({
    mutationFn: async (variables) => {
      const updates = Object.entries(variables).map(([key, value]) =>
        axios.put(`/api/server/${id}/variables`, { key, value })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['server', id, 'startup']);
      toast({ title: "Success", description: "Variables updated successfully" });
      setEditedVariables({});
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to update variables');
    }
  });

  const handleLogout = async () => {
    const response = await fetch('/api/user/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) navigate('/auth');
  };

  // Update startup configuration mutation
  const updateStartup = useMutation({
    mutationFn: async (config) => {
      const internalId = serverData?.attributes?.internal_id;
      if (!internalId) throw new Error('Server internal ID not found');
      await axios.put(`/api/server/${internalId}/startup`, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['server', id]);
      queryClient.invalidateQueries(['server', id, 'startup']);
      toast({ 
        title: "Success", 
        description: "Startup configuration updated successfully. A re-login is required to apply changes.",
        action: (
          <Button size="sm" variant="outline" onClick={handleLogout} className="bg-white text-black hover:bg-neutral-200">
            Logout Now
          </Button>
        )
      });
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to update startup configuration');
    }
  });

  // Reinstall server mutation
  const reinstallServer = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/server/${id}/reinstall`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Server reinstallation initiated" });
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to reinstall server');
    }
  });

  // Delete server mutation
  const deleteServer = useMutation({
    mutationFn: async () => {
      const serverId = serverData?.attributes?.identifier || id;
      await axios.delete(`/api/v5/servers/${serverId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Server deleted successfully" });
      navigate('/dashboard'); // Redirect to dashboard after deletion
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to delete server');
    }
  });

  // Rename server mutation
  const renameServer = useMutation({
    mutationFn: async (name) => {
      await axios.post(`/api/server/${id}/rename`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['server', id]);
      toast({ title: "Success", description: "Server renamed successfully" });
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to rename server');
    }
  });

  if (isLoadingServer || isLoadingStartup) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  const server = serverData?.attributes ?? null;
  const currentServerName = server?.name || '';
  const variables = startupData?.data || [];
  const dockerImages = startupData?.meta?.docker_images || {};

  const handleVariableChange = (key, value) => {
    setEditedVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveVariables = () => {
    if (Object.keys(editedVariables).length > 0) {
      updateVariables.mutate(editedVariables);
    }
  };

  const handleSaveStartup = () => {
    const config = {
      startup: editedStartup.command,
      image: editedStartup.image,
      skip_scripts: false
    };
    updateStartup.mutate(config);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (serverName.trim() && serverName !== currentServerName) {
      renameServer.mutate(serverName);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation === serverName) {
      deleteServer.mutate();
    }
  };

  const hasStartupChanges =
    editedStartup.command !== server?.invocation ||
    editedStartup.image !== server?.docker_image;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-neutral-400">
            Manage your server configuration and variables
          </p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="startup" className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Startup
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="w-4 h-4" />
            Variables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Details</CardTitle>
              <CardDescription>
                View and modify basic server settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleRename} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Server Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Enter server name"
                    />
                    <Button
                      type="submit"
                      disabled={!serverName.trim() || serverName === currentServerName || renameServer.isPending}
                    >
                      {renameServer.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </form>

              <div className="pt-4 space-y-4">
                <div className="flex flex-col space-y-4">
                  <Separator className="bg-white/5" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Reinstall Server</h4>
                      <p className="text-sm text-neutral-400">
                        This will reinstall the server with default settings, but may preserve some files.
                      </p>
                      <ConfirmDialog
                        title="Are you absolutely sure?"
                        description="This action will reinstall your server. All data will be lost and cannot be recovered."
                        confirmText="Reinstall Server"
                        variant="destructive"
                        onConfirm={() => reinstallServer.mutate()}
                        trigger={
                          <Button
                            variant="destructive"
                            disabled={reinstallServer.isPending}
                            className="mt-2"
                          >
                            {reinstallServer.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <PowerOff className="w-4 h-4 mr-2" />
                            )}
                            Reinstall Server
                          </Button>
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Delete Server</h4>
                      <p className="text-sm text-neutral-400">
                        This will permanently delete your server and all its data. Your allocated resources will be returned.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={deleteServer.isPending}
                        className="mt-2"
                      >
                        {deleteServer.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Server
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="startup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Startup Configuration</CardTitle>
              <CardDescription>
                View and modify server startup parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Startup Command</Label>
                  <Input
                    value={editedStartup.command}
                    onChange={(e) => setEditedStartup(prev => ({ ...prev, command: e.target.value }))}
                    placeholder="Enter startup command"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Docker Image</Label>
                  <Select
                    value={editedStartup.image}
                    onValueChange={(value) => setEditedStartup(prev => ({ ...prev, image: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Docker image" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dockerImages).map(([name, image]) => (
                        <SelectItem key={image} value={image}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end mt-4">
                  <ConfirmDialog
                    title="Save Startup Changes?"
                    description="Updating startup configuration might require a restart. Proceed?"
                    confirmText="Save Changes"
                    onConfirm={handleSaveStartup}
                    trigger={
                      <Button
                        disabled={!hasStartupChanges || updateStartup.isPending}
                      >
                        {updateStartup.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Configure environment-specific settings
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveVariables}
                disabled={Object.keys(editedVariables).length === 0 || updateVariables.isPending}
              >
                {updateVariables.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {variables.map((variable) => {
                    const isEdited = editedVariables[variable.attributes.env_variable] !== undefined;
                    return (
                      <div key={variable.attributes.env_variable} className="space-y-2">
                        <Label htmlFor={variable.attributes.env_variable}>
                          {variable.attributes.name}
                          {variable.attributes.description && (
                            <span className="block text-xs text-neutral-400 mt-1">
                              {variable.attributes.description}
                            </span>
                          )}
                        </Label>
                        <Input
                          id={variable.attributes.env_variable}
                          defaultValue={variable.attributes.server_value || variable.attributes.default_value}
                          disabled={!variable.attributes.is_editable}
                          className={isEdited ? "border-blue-500" : ""}
                          onChange={(e) => handleVariableChange(
                            variable.attributes.env_variable,
                            e.target.value
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Server Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation('');
      }}>
        <AlertDialogContent className="bg-neutral-950 border border-neutral-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Server Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-neutral-400">
              <p>
                This action <span className="font-bold text-white">cannot be undone</span>. This will permanently delete your server and all associated data, including worlds, configs, and plugins.
              </p>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400 text-sm">
                <p className="font-medium text-blue-300">What happens when you delete a server:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All server files and data will be permanently deleted</li>
                  <li>All allocated resources (RAM, CPU, Disk) will be returned</li>
                  <li>You can create a new server with the reclaimed resources</li>
                </ul>
              </div>

              <div className="pt-2">
                <Label htmlFor="confirm" className="mb-2 block text-neutral-300">
                  Type <span className="font-bold text-white">{serverName}</span> to confirm:
                </Label>
                <Input
                  id="confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="bg-neutral-900 border-neutral-800 text-white"
                  placeholder={serverName}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-white border-neutral-700 hover:bg-neutral-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmation !== serverName || deleteServer.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteServer.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
