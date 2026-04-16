import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, RefreshCw, Copy, Globe, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const SubdomainsPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [subdomains, setSubdomains] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [newSubdomain, setNewSubdomain] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchSubdomains = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/v5/server/${id}/subdomains`);
      setSubdomains(response.data.subdomains || response.data);
    } catch (err) {
      console.error(err);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to fetch subdomains." 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/api/v5/subdomains/domains');
      setDomains(response.data);
      if (response.data.length > 0) {
        const defaultDomain = response.data.find(d => d.isDefault) || response.data[0];
        setSelectedDomain(defaultDomain.domain);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newSubdomain.trim() || !selectedDomain) return;
    
    setCreateLoading(true);
    try {
      const response = await axios.post(`/api/v5/server/${id}/subdomains`, {
        subdomain: newSubdomain.trim(),
        domainName: selectedDomain
      });
      setSubdomains([...subdomains, response.data]);
      toast({ title: "Success", description: "Subdomain created successfully." });
      setDialogOpen(false);
      setNewSubdomain('');
    } catch (err) {
      const errorDetail = err.response?.data?.error || err.response?.data?.message;
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorDetail || "Failed to create subdomain." 
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (subdomain) => {
    setDeleteLoading(subdomain.id);
    try {
      await axios.delete(`/api/v5/server/${id}/subdomains/${subdomain.id}`);
      setSubdomains(subdomains.filter(s => s.id !== subdomain.id));
      toast({ title: "Success", description: "Subdomain deleted successfully." });
    } catch (err) {
      const errorDetail = err.response?.data?.error || err.response?.data?.message;
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorDetail || "Failed to delete subdomain." 
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCopy = (subdomain) => {
    const fullAddress = `${subdomain.name}.${subdomain.domain}`;
    navigator.clipboard.writeText(fullAddress);
    setCopiedId(subdomain.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchSubdomains();
    fetchDomains();
  }, [id]);

  const isValidSubdomain = (value) => {
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value);
  };

  const getFullAddress = (subdomain) => {
    return `${subdomain.name}.${subdomain.domain}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Subdomains</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage custom subdomains for this server.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-neutral-200">
              <Plus className="w-4 h-4 mr-2" />
              New subdomain
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#202229] border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle>Create Subdomain</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Create a new subdomain for your server.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Subdomain name</label>
                <Input
                  value={newSubdomain}
                  onChange={(e) => setNewSubdomain(e.target.value.toLowerCase())}
                  placeholder="my-server"
                  className="bg-[#151719] border-neutral-800 text-white"
                />
                {newSubdomain && !isValidSubdomain(newSubdomain) && (
                  <p className="text-xs text-red-400">Only lowercase letters, numbers, and hyphens allowed</p>
                )}
                {newSubdomain && isValidSubdomain(newSubdomain) && selectedDomain && (
                  <p className="text-xs text-neutral-500">
                    Preview: <span className="text-white">{newSubdomain}.{selectedDomain}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger className="bg-[#151719] border-neutral-800 text-white">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#202229] border-neutral-800 text-white">
                    {domains.map((domain) => (
                      <SelectItem 
                        key={domain.domain} 
                        value={domain.domain}
                        className="focus:bg-neutral-800 focus:text-white"
                      >
                        {domain.domain} {domain.isDefault && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="bg-transparent text-white border-neutral-700 hover:bg-neutral-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newSubdomain.trim() || !selectedDomain || !isValidSubdomain(newSubdomain) || createLoading}
                className="bg-white text-black hover:bg-neutral-200"
              >
                {createLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : subdomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-neutral-400">
              <Globe className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No subdomains yet</p>
              <Button
                variant="link"
                onClick={() => setDialogOpen(true)}
                className="text-white mt-2"
              >
                Create your first subdomain
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-neutral-800">
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Subdomain</TableHead>
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Domain</TableHead>
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Full Address</TableHead>
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subdomains.map((subdomain) => (
                      <TableRow key={subdomain.id} className="hover:bg-neutral-900/50 border-neutral-800">
                        <TableCell>
                          <span className="font-bold text-white text-sm">{subdomain.name}</span>
                        </TableCell>
                        <TableCell className="text-neutral-400 text-sm">{subdomain.domain}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-neutral-300 text-sm font-mono">
                              {getFullAddress(subdomain)}
                            </span>
                            <button
                              onClick={() => handleCopy(subdomain)}
                              className="text-neutral-400 hover:text-white transition-colors"
                            >
                              {copiedId === subdomain.id ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-400 text-sm">
                          {formatDate(subdomain.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ConfirmDialog
                            trigger={
                              <button
                                disabled={deleteLoading === subdomain.id}
                                className="text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center"
                              >
                                {deleteLoading === subdomain.id ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                              </button>
                            }
                            title="Delete Subdomain"
                            description={`Are you sure you want to delete ${getFullAddress(subdomain)}?`}
                            confirmText="Delete"
                            variant="destructive"
                            onConfirm={() => handleDelete(subdomain)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubdomainsPage;