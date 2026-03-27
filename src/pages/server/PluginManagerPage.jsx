import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Download, Search, RefreshCw, Star, Loader2, Gem,
  Filter, ExternalLink, Package, Check, Info,
  CheckCircle2, AlertCircle, X, Trash, MoreHorizontal
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const PluginsPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('spigot');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOption, setSortOption] = useState('downloads');
  const [plugins, setPlugins] = useState([]);
  const [installedPlugins, setInstalledPlugins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [pluginDetails, setPluginDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState('details'); // 'details', 'install', 'success', 'error'
  const [installStatus, setInstallStatus] = useState({ success: null, message: '' });
  const [isInstalling, setIsInstalling] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [untrackingPluginId, setUntrackingPluginId] = useState(null);

  // Load platforms
  const fetchPlatforms = async () => {
    try {
      const response = await axios.get('/api/plugins/platforms');
      setPlatforms(response.data.platforms);
      setSelectedPlatform(response.data.default);
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    }
  };

  // Load categories for the selected platform
  const fetchCategories = async (platform) => {
    try {
      const response = await axios.get('/api/plugins/categories', {
        params: { platform }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const scanForPlugins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/plugins/scan/${id}`);
      if (response.data.success) {
        setInstalledPlugins(Array.isArray(response.data.plugins) ? response.data.plugins : []);
        toast({
          title: "Scan Successful",
          description: "Installed plugins list has been updated."
        });
      }
    } catch (err) {
      console.error('Failed to scan for plugins:', err);
      toast({
        title: "Scan Failed",
        description: "Could not scan for installed plugins.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // When fetching installed plugins, ensure we always have an array
  const fetchInstalledPlugins = async (withScan = false) => {
    try {
      if (withScan) {
        await scanForPlugins();
        return;
      }

      const response = await axios.get(`/api/plugins/installed/${id}`);
      setInstalledPlugins(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch installed plugins:', err);
      setInstalledPlugins([]);
    }
  };

  // Fetch plugins from the backend
  const fetchPlugins = async (page = 1, loadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        platform: selectedPlatform,
        page,
        size: 20,
        sort: sortOption
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const endpoint = searchQuery ? '/api/plugins/search' : '/api/plugins/list';
      if (searchQuery) {
        params.query = searchQuery;
      }

      const response = await axios.get(endpoint, { params });

      if (loadMore) {
        setPlugins(prev => [...prev, ...response.data]);
      } else {
        setPlugins(response.data);
      }

      setHasMorePages(response.data.length === 20); // If we got fewer than requested, no more pages
      setPage(page);
    } catch (err) {
      setError('Failed to fetch plugins. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load more plugins
  const loadMorePlugins = () => {
    if (hasMorePages && !loading) {
      fetchPlugins(page + 1, true);
    }
  };

  // Handle search input changes with debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset to first page
      fetchPlugins(1);
    }, 500); // 500ms debounce
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setPage(1);
    fetchPlugins(1);
  };

  // Handle platform change
  const handlePlatformChange = (platform) => {
    setSelectedPlatform(platform);
    setSelectedCategory(null);
    setPage(1);
    fetchCategories(platform);
  };

  // Handle category change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    fetchPlugins(1);
  };

  // Handle sort option change
  const handleSortChange = (option) => {
    setSortOption(option);
    setPage(1);
    fetchPlugins(1);
  };

  // Fetch plugin details
  const fetchPluginDetails = async (pluginId, platform) => {
    try {
      const response = await axios.get(`/api/plugins/details/${pluginId}`, {
        params: { platform }
      });
      setPluginDetails(response.data);
    } catch (err) {
      console.error('Failed to fetch plugin details:', err);
    }
  };

  // Handle plugin click to show details in modal
  const handlePluginClick = (plugin) => {
    setSelectedPlugin(plugin);
    setPluginDetails(null); // Clear previous details
    setModalView('details');
    setIsModalOpen(true);
    fetchPluginDetails(plugin.id, plugin.platform);
  };

  // Handle plugin installation
  const handleInstall = async (pluginId, platform) => {
    setIsInstalling(true);
    setModalView('install');

    try {
      const response = await axios.post(`/api/plugins/install/${id}`, {
        pluginId: String(pluginId),
        platform
      });

      setInstallStatus({
        success: true,
        message: response.data.message,
        pluginName: response.data.pluginName
      });

      // Update installed plugins list
      fetchInstalledPlugins();
      setModalView('success');
      toast({
        title: "Installation Successful",
        description: response.data.message || `${response.data.pluginName} has been installed.`
      });
    } catch (err) {
      setInstallStatus({
        success: false,
        message: err.response?.data?.error || 'Failed to install plugin.'
      });
      setModalView('error');
      toast({
        title: "Installation Failed",
        description: err.response?.data?.error || 'Failed to install plugin.',
        variant: "destructive"
      });
      console.error(err);
    } finally {
      setIsInstalling(false);
    }
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedPlugin(null);
      setPluginDetails(null);
      setModalView('details');
      setInstallStatus({ success: null, message: '' });
    }, 200);
  };

  // Handle untrack plugin
  const handleUntrackPlugin = async (pluginId, platform, pluginName) => {
    setUntrackingPluginId(pluginId);
    try {
      await axios.delete(`/api/plugins/untrack/${id}`, {
        data: {
          pluginId: String(pluginId),
          platform: String(platform)
        }
      });
      
      // Update installed plugins list
      await fetchInstalledPlugins();
      
      toast({
        title: "Plugin Hidden",
        description: `${pluginName} is no longer tracked. Use Scan & Retrack to add it back from your server files.`
      });
    } catch (err) {
      console.error('Failed to untrack plugin:', err);
      toast({
        title: "Removal Failed",
        description: err.response?.data?.error || "Could not untrack the plugin.",
        variant: "destructive"
      });
    } finally {
      setUntrackingPluginId(null);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchPlatforms();
    fetchInstalledPlugins();
  }, [id]);

  // Load categories when platform changes
  useEffect(() => {
    if (selectedPlatform) {
      fetchCategories(selectedPlatform);
    }
  }, [selectedPlatform]);

  // Load plugins when tab, platform, or category changes
  useEffect(() => {
    if (activeTab === 'browse') {
      setPage(1);
      fetchPlugins(1);
    }
  }, [activeTab, selectedPlatform, selectedCategory, sortOption]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Check if a plugin is already installed
  // Check if a plugin is already installed
  const isPluginInstalled = (pluginId, platform) => {
    // Make sure installedPlugins is an array before using .some()
    return Array.isArray(installedPlugins) &&
      installedPlugins.some(p => p && p.id === pluginId && p.platform === platform);
  };

  // Render plugin card for grid view
  const renderPluginCard = (plugin) => {
    const installed = isPluginInstalled(plugin.id, plugin.platform);

    return (
      <Card
        key={`${plugin.platform}-${plugin.id}`}
        className="flex flex-col h-full cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => handlePluginClick(plugin)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 rounded-md flex-shrink-0">
              <AvatarImage 
                src={plugin.icon} 
                alt={`${plugin.name} icon`}
              />
              <AvatarFallback className="rounded-md bg-neutral-800 text-neutral-400 text-sm">
                {plugin.name?.charAt(0)?.toUpperCase() || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{plugin.name}</CardTitle>
                  <CardDescription className="text-xs text-neutral-400 line-clamp-2">
                    {plugin.tag}
                  </CardDescription>
                </div>
                {plugin.premium ? (
                  <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                    <Gem className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                ) : installed ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20">
                    <Check className="w-3 h-3 mr-1" />
                    Installed
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <div className="flex items-center justify-between text-sm mt-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-400" />
              <span>{plugin.rating?.average?.toFixed(1) || 'N/A'}</span>
            </div>
            <Badge variant="secondary" className="flex items-center">
              <Download className="w-3 h-3 mr-1" />
              {plugin.downloads > 999
                ? `${(plugin.downloads / 1000).toFixed(1)}K`
                : plugin.downloads}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Plugins</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedPlugins.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content container with Tabs context */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Browse Plugins Tab */}
        <TabsContent value="browse" className="space-y-6 mt-0">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Platform</p>
                    <Select
                      value={selectedPlatform}
                      onValueChange={handlePlatformChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map(platform => (
                          <SelectItem key={platform} value={platform}>
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Category</p>
                    <Select
                      value={selectedCategory || ''}
                      onValueChange={val => handleCategoryChange(val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Sort By</p>
                    <Select
                      value={sortOption}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downloads">Most Downloads</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search plugins..."
                  className="flex-1 bg-neutral-950/50 border-neutral-800/50"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory || searchQuery) && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Category: {(Array.isArray(categories) ? categories.find(c => c.id.toString() === selectedCategory)?.name : null) || selectedCategory}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-neutral-800"
                    onClick={() => handleCategoryChange(null)}
                  >
                    <span className="sr-only">Remove</span>
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-neutral-800"
                    onClick={() => {
                      setSearchQuery('');
                      fetchPlugins(1);
                    }}
                  >
                    <span className="sr-only">Clear</span>
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                  fetchPlugins(1);
                }}
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Plugins Grid */}
          {loading && plugins.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : plugins.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12">
              <Package className="w-12 h-12 text-neutral-500 mb-4" />
              <h3 className="text-lg font-medium">No plugins found</h3>
              <p className="text-neutral-400 text-center mt-2">
                Try adjusting your search or filters
              </p>
            </Card>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {plugins.map(renderPluginCard)}
              </div>

              {/* Load More Button */}
              {hasMorePages && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={loadMorePlugins}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Installed Plugins Tab */}
        <TabsContent value="installed" className="mt-0">
          <Card className="border-neutral-800/50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Installed Plugins</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchInstalledPlugins(false)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchInstalledPlugins(true)}
                    disabled={loading}
                    title="Re-scan the /plugins folder and restore tracked plugins"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Scan & Retrack
                  </Button>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-2">
                Hidden a plugin by mistake? Use Scan & Retrack to restore plugins that still exist in your server files.
              </p>
            </CardHeader>
            <CardContent>
              {installedPlugins.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Package className="w-12 h-12 text-neutral-500 mb-4" />
                  <h3 className="text-lg font-medium">No plugins installed</h3>
                  <p className="text-neutral-400 mt-2">
                    Browse and install plugins to enhance your server
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab('browse')}
                  >
                    Browse Plugins
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Installed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installedPlugins.map((plugin) => (
                      <TableRow key={`${plugin.platform}-${plugin.id}`}>
                        <TableCell className="font-medium">{plugin.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {plugin.platform}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {plugin.manuallyAdded ? (
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                              <Info className="w-3 h-3 mr-1" />
                              Manual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Marketplace
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(plugin.installedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* External Link - only for marketplace plugins */}
                            {plugin.external_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(plugin.external_url, '_blank')}
                                title="Open in Marketplace"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Hide tracking action */}
                            <ConfirmDialog
                              title="Hide Plugin"
                              description={`Hide "${plugin.name}" from the tracked list? This will keep the plugin files on your server, and you can bring it back with Scan & Retrack.`}
                              confirmText="Hide"
                              onConfirm={() => handleUntrackPlugin(plugin.id, plugin.platform, plugin.name)}
                              variant="destructive"
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={untrackingPluginId === plugin.id}
                                  title="Hide plugin from tracking"
                                >
                                  {untrackingPluginId === plugin.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash className="w-4 h-4 text-red-500" />
                                  )}
                                </Button>
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plugin Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) handleCloseModal();
      }}>
        <DialogContent className="sm:max-w-[500px] text-white">
          {modalView === 'details' && selectedPlugin && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 pr-8">
                  <Avatar className="h-12 w-12 rounded-md flex-shrink-0">
                    <AvatarImage 
                      src={pluginDetails?.icon || selectedPlugin.icon} 
                      alt={`${selectedPlugin.name} icon`}
                    />
                    <AvatarFallback className="rounded-md bg-neutral-800 text-neutral-400">
                      {selectedPlugin.name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <DialogTitle className="truncate">{selectedPlugin.name}</DialogTitle>
                      {selectedPlugin.platform && (
                        <Badge variant="outline" className="capitalize flex-shrink-0 border-neutral-600 text-white">
                          {selectedPlugin.platform}
                        </Badge>
                      )}
                    </div>
                    <DialogDescription className="line-clamp-2 mt-1">
                      {selectedPlugin.tag}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {!pluginDetails ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 my-2">
                  {/* Plugin stats */}
                  <div className="flex flex-wrap gap-3">
                      <Badge variant="secondary" className="flex items-center border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-800">
                        <Download className="w-3 h-3 mr-1" />
                        {(pluginDetails.downloads || 0).toLocaleString()} downloads
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-white">{pluginDetails.rating?.average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>

                  {/* Version info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-neutral-300">Version</h4>
                      <p className="text-sm text-neutral-400">{pluginDetails.version?.name || 'Latest'}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-neutral-300">Author</h4>
                      <p className="text-sm text-neutral-400">{pluginDetails.author?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-neutral-300">Last Updated</h4>
                      <p className="text-sm text-neutral-400">{formatDate(pluginDetails.updateDate)}</p>
                    </div>
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-neutral-300">Released</h4>
                      <p className="text-sm text-neutral-400">{formatDate(pluginDetails.releaseDate)}</p>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 items-stretch sm:items-center">
                  <Button
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => window.open(pluginDetails?.external_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                {selectedPlugin.premium ? (
                  <Button
                    variant="outline"
                    disabled
                    className="flex-1 bg-amber-500/20 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400"
                  >
                    <Gem className="w-4 h-4 mr-2" />
                    Premium Plugin
                  </Button>
                ) : isPluginInstalled(selectedPlugin.id, selectedPlugin.platform) ? (
                  <Button
                    variant="outline"
                    disabled
                    className="flex-1 bg-green-500/20 text-green-400 border-green-500/20"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Already Installed
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleInstall(selectedPlugin.id, selectedPlugin.platform)}
                    className="flex-1"
                    disabled={isInstalling}
                  >
                    {isInstalling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isInstalling ? 'Installing...' : 'Install Plugin'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}

          {modalView === 'install' && (
            <>
              <DialogHeader>
                <DialogTitle>Installing Plugin</DialogTitle>
                <DialogDescription>
                  Please wait while the plugin is being installed...
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </>
          )}

          {modalView === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  Installation Successful
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="mb-2">{installStatus.message}</p>
                <p className="text-sm text-neutral-400">
                  Restart your server to activate the plugin.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseModal}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}

          {modalView === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  Installation Failed
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>{installStatus.message}</p>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseModal}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PluginsPage;
