import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { showApiErrorToast } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertTriangle,
  Loader2,
  PowerOff,
  RefreshCw,
  Save,
  Settings,
  Terminal,
  Trash2,
  Variable,
  Gamepad2,
  Link2,
  Pencil,
  Shield,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
      const { data } = await axios.get(`/api/v5/server/${id}`);
      setServerName(data.attributes.name);
      setEditedStartup(prev => ({
        ...prev,
        command: data.attributes.invocation || '',
        image: data.attributes.docker_image || ''
      }));
      return data;
    }
  });

  const isOwner = !isLoadingServer && (serverData?.meta?.isOwner ?? false);

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

  const [editedMinecraftProperties, setEditedMinecraftProperties] = useState({});
  const [editedMinecraftSpigot, setEditedMinecraftSpigot] = useState({});

  // Fetch Minecraft settings
  const { data: minecraftData, isLoading: isLoadingMinecraft } = useQuery({
    queryKey: ['server', id, 'minecraft-settings'],
    queryFn: async () => {
      const { data } = await axios.get(`/api/server/${id}/minecraft/settings`);
      return data;
    }
  });

  // Update Minecraft settings mutation
  const updateMinecraftSettings = useMutation({
    mutationFn: async (updates) => {
      await axios.post(`/api/server/${id}/minecraft/settings`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['server', id, 'minecraft-settings']);
      toast({ title: "Success", description: "Minecraft settings updated successfully" });
      setEditedMinecraftProperties({});
      setEditedMinecraftSpigot({});
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to update Minecraft settings');
    }
  });

  const handleMinecraftPropertyChange = (key, value) => {
    setEditedMinecraftProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMinecraftSpigotChange = (key, value) => {
    setEditedMinecraftSpigot(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderToggleBox = (label, propertyKey, configStringKey, inverted = false) => {
    const rawVal = editedMinecraftProperties[propertyKey] !== undefined
      ? editedMinecraftProperties[propertyKey]
      : (minecraftData?.properties?.[propertyKey] || 'false');
    
    const value = inverted ? rawVal === 'false' : rawVal === 'true';

    const handleChange = (newVal) => {
      const stringVal = inverted ? (newVal ? 'false' : 'true') : (newVal ? 'true' : 'false');
      handleMinecraftPropertyChange(propertyKey, stringVal);
    };

    const displayRawValue = editedMinecraftProperties[propertyKey] !== undefined
      ? editedMinecraftProperties[propertyKey]
      : (minecraftData?.properties?.[propertyKey] || 'false');

    return (
      <div className="rounded-lg overflow-hidden border border-white/5 flex flex-col bg-[#111319]">
        <div className="bg-white text-neutral-900 p-3 flex items-center justify-between h-14">
          <span className="font-semibold text-sm">{label}</span>
          <button
            type="button"
            onClick={() => handleChange(!value)}
            className="w-12 h-7 bg-[#1c1e24] border border-white/10 rounded flex items-center p-0.5 relative overflow-hidden focus:outline-none"
          >
            <div
              className={`w-1/2 h-full rounded flex items-center justify-center transition-all duration-200 ${
                value
                  ? 'translate-x-full bg-emerald-500'
                  : 'translate-x-0 bg-rose-500'
              }`}
            >
              {value ? (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        </div>
        <div className="bg-[#12141a] px-3 py-1.5 text-[10px] font-mono text-neutral-400 border-t border-white/5">
          {configStringKey}={displayRawValue}
        </div>
      </div>
    );
  };

  const renderSpigotToggleBox = (label, spigotKey, configStringKey) => {
    const rawVal = editedMinecraftSpigot[spigotKey] !== undefined
      ? editedMinecraftSpigot[spigotKey]
      : (minecraftData?.spigot?.[spigotKey] || 'false');
    
    const value = rawVal === 'true';

    const handleChange = (newVal) => {
      handleMinecraftSpigotChange(spigotKey, newVal ? 'true' : 'false');
    };

    return (
      <div className="rounded-lg overflow-hidden border border-white/5 flex flex-col bg-[#111319]">
        <div className="bg-white text-neutral-900 p-3 flex items-center justify-between h-14">
          <span className="font-semibold text-sm">{label}</span>
          <button
            type="button"
            onClick={() => handleChange(!value)}
            className="w-12 h-7 bg-[#1c1e24] border border-white/10 rounded flex items-center p-0.5 relative overflow-hidden focus:outline-none"
          >
            <div
              className={`w-1/2 h-full rounded flex items-center justify-center transition-all duration-200 ${
                value
                  ? 'translate-x-full bg-emerald-500'
                  : 'translate-x-0 bg-rose-500'
              }`}
            >
              {value ? (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </button>
        </div>
        <div className="bg-[#12141a] px-3 py-1.5 text-[10px] font-mono text-neutral-400 border-t border-white/5">
          {configStringKey}={rawVal}
        </div>
      </div>
    );
  };

  const renderNumberBox = (label, propertyKey, configStringKey, Icon, min = 0) => {
    const value = editedMinecraftProperties[propertyKey] !== undefined
      ? editedMinecraftProperties[propertyKey]
      : (minecraftData?.properties?.[propertyKey] || '0');

    const numValue = parseInt(value) || 0;

    const handleChange = (newVal) => {
      handleChangeVal(newVal);
    };

    const handleChangeVal = (newVal) => {
      handleMinecraftPropertyChange(propertyKey, newVal);
    };

    return (
      <div className="rounded-lg overflow-hidden border border-white/5 flex flex-col bg-[#111319]">
        <div className="bg-white text-neutral-900 p-3 flex items-center justify-between h-14">
          <span className="font-semibold text-sm">{label}</span>
          <div className="flex items-center bg-[#1c1e24] rounded border border-white/10 overflow-hidden text-white">
            <div className="p-1.5 text-neutral-400">
              <Icon className="w-4 h-4" />
            </div>
            <input
              type="number"
              value={value}
              onChange={(e) => handleChangeVal(e.target.value)}
              className="w-12 bg-transparent text-center text-sm font-semibold border-none outline-none py-1 focus:ring-0 focus:outline-none"
              min={min}
            />
            <div className="flex flex-col border-l border-white/10 text-xs select-none">
              <button
                type="button"
                onClick={() => handleChangeVal(String(Math.max(min, numValue + 1)))}
                className="px-1.5 py-0.5 hover:bg-white/10 text-neutral-400 border-b border-white/10 text-[9px] font-bold focus:outline-none"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleChangeVal(String(Math.max(min, numValue - 1)))}
                className="px-1.5 py-0.5 hover:bg-white/10 text-neutral-400 text-[9px] font-bold focus:outline-none"
              >
                -
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#12141a] px-3 py-1.5 text-[10px] font-mono text-neutral-400 border-t border-white/5">
          {configStringKey}={value}
        </div>
      </div>
    );
  };

  const renderSelectBox = (label, propertyKey, configStringKey, options) => {
    const value = editedMinecraftProperties[propertyKey] !== undefined
      ? editedMinecraftProperties[propertyKey]
      : (minecraftData?.properties?.[propertyKey] || options[0].value);

    const handleChange = (newVal) => {
      handleMinecraftPropertyChange(propertyKey, newVal);
    };

    return (
      <div className="rounded-lg overflow-hidden border border-white/5 flex flex-col bg-[#111319]">
        <div className="bg-white text-neutral-900 p-3 flex items-center justify-between h-14 gap-2">
          <span className="font-semibold text-sm truncate">{label}</span>
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="w-32 bg-[#1c1e24] text-white border-white/10 h-8 text-xs font-semibold focus:ring-0 focus:outline-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1c1e24] text-white border-white/10">
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs hover:bg-white/10 cursor-pointer">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="bg-[#12141a] px-3 py-1.5 text-[10px] font-mono text-neutral-400 border-t border-white/5">
          {configStringKey}={value}
        </div>
      </div>
    );
  };

  const renderTextBox = (label, propertyKey, configStringKey, placeholder, Icon) => {
    const value = editedMinecraftProperties[propertyKey] !== undefined
      ? editedMinecraftProperties[propertyKey]
      : (minecraftData?.properties?.[propertyKey] || '');

    const handleChange = (newVal) => {
      handleMinecraftPropertyChange(propertyKey, newVal);
    };

    return (
      <div className="rounded-lg overflow-hidden border border-white/5 flex flex-col bg-[#111319] w-full">
        <div className="bg-white text-neutral-900 p-3 flex items-center justify-between h-14 gap-4">
          <span className="font-semibold text-sm truncate shrink-0">{label}</span>
          <div className="flex items-center bg-[#1c1e24] rounded border border-white/10 overflow-hidden text-white flex-1 max-w-[500px]">
            {Icon && (
              <div className="pl-2 text-neutral-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent px-3 py-1 text-xs font-medium border-none outline-none focus:ring-0 focus:outline-none"
            />
          </div>
        </div>
        <div className="bg-[#12141a] px-3 py-1.5 text-[10px] font-mono text-neutral-400 border-t border-white/5">
          {configStringKey}="{value}"
        </div>
      </div>
    );
  };

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
      await axios.put(`/api/server/${id}/startup`, config);
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
          {!isLoadingMinecraft && minecraftData?.isMinecraft && (
            <TabsTrigger value="minecraft" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Minecraft
            </TabsTrigger>
          )}
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
                        disabled={deleteServer.isPending || !isOwner}
                        className="mt-2"
                      >
                        {deleteServer.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Server
                      </Button>
                      {!isOwner && (
                        <p className="text-xs text-neutral-500 mt-2">
                          Only the server owner can delete this server.
                        </p>
                      )}
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

        {/* Minecraft Settings Tab */}
        {!isLoadingMinecraft && minecraftData?.isMinecraft && (
          <TabsContent value="minecraft" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Minecraft Settings</h2>
                <p className="text-sm text-neutral-400">Configure your server.properties and spigot.yml</p>
              </div>
              <Button
                onClick={() => updateMinecraftSettings.mutate({ properties: editedMinecraftProperties, spigot: editedMinecraftSpigot })}
                disabled={(Object.keys(editedMinecraftProperties).length === 0 && Object.keys(editedMinecraftSpigot).length === 0) || updateMinecraftSettings.isPending}
              >
                {updateMinecraftSettings.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>

            {/* server.properties label */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <span className="px-2 py-0.5 bg-white/5 rounded text-neutral-400">server.properties</span>
            </div>

            {/* Row 1: Slots, Gamemode, Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderNumberBox('Slots', 'max-players', 'max-players', Users, 1)}
              {renderSelectBox('Gamemode', 'gamemode', 'gamemode', [
                { label: 'Survival', value: 'survival' },
                { label: 'Creative', value: 'creative' },
                { label: 'Adventure', value: 'adventure' },
                { label: 'Spectator', value: 'spectator' },
              ])}
              {renderSelectBox('Difficulty', 'difficulty', 'difficulty', [
                { label: 'Easy', value: 'easy' },
                { label: 'Normal', value: 'normal' },
                { label: 'Hard', value: 'hard' },
                { label: 'Peaceful', value: 'peaceful' },
              ])}
            </div>

            {/* Row 2: Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderToggleBox('Whitelist', 'white-list', 'white-list')}
              {renderToggleBox('Cracked', 'online-mode', 'online-mode', true)}
              {renderToggleBox('Fly', 'allow-flight', 'allow-flight')}
              {renderToggleBox('Force Gamemode', 'force-gamemode', 'force-gamemode')}
              {renderNumberBox('Spawn Protection', 'spawn-protection', 'spawn-protection', Shield, 0)}
              {renderToggleBox('Resource pack required', 'require-resource-pack', 'require-resource-pack')}
            </div>

            {/* Row 3: Text fields */}
            <div className="space-y-3">
              {renderTextBox('Resource pack', 'resource-pack', 'resource-pack', 'https://example.com/resource-pack.zip', Link2)}
              {renderTextBox('Resource pack prompt', 'resource-pack-prompt', 'resource-pack-prompt', 'Download the server resource pack?', Pencil)}
            </div>

            {/* spigot.yml section */}
            {minecraftData?.spigot && Object.keys(minecraftData.spigot).length > 0 || true ? (
              <>
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                  <span className="px-2 py-0.5 bg-white/5 rounded text-neutral-400">spigot.yml</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {renderSpigotToggleBox('BungeeCord', 'bungeecord', 'bungeecord')}
                </div>
              </>
            ) : null}
          </TabsContent>
        )}
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
