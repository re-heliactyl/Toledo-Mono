import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/format';
import { getApiErrorMessage, showApiErrorToast } from '@/lib/api';

const BackupsPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchBackups = async () => {
    setLoading(false); // Don't show loading spinner during auto-refresh
    setError(null);
    try {
      const response = await axios.get(`/api/server/${id}/backups`);
      setBackups(response.data.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to fetch backups. Please try again later.'));
      console.error(err);
    }
  };

  const handleCreateBackup = async () => {
    setCreateLoading(true);
    try {
      const response = await axios.post(`/api/server/${id}/backups`);
      setBackups([...backups, response.data]);
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Backup creation has been started.",
      });
    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to create backup. Please try again later.');
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteBackup = async (backup) => {
    try {
      await axios.delete(`/api/server/${id}/backups/${backup.attributes.uuid}`);
      setBackups(backups.filter(b => b.attributes.uuid !== backup.attributes.uuid));
      toast({
        title: "Success",
        description: "Backup deleted successfully.",
      });
    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to delete backup. Please try again later.');
      console.error(err);
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      const response = await axios.get(`/api/server/${id}/backups/${backup.attributes.uuid}/download`);
      window.open(response.data.attributes.url, '_blank');
    } catch (err) {
      console.error('Failed to generate download link:', err);
    }
  };

  const getBackupStatus = (backup) => {
    if (!backup.attributes.is_successful && backup.attributes.bytes === 0) {
      return 'Creating';
    }
    return backup.attributes.is_successful ? 'Completed' : 'Failed';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      setCreateLoading(false);
    }
  }, [isCreateModalOpen]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Backups</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Backup
        </Button>
      </div>

      <Card className="border-neutral-800/50">
        <CardHeader>
          <CardTitle className="text-base">Server backups</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[200px] text-red-400">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup) => (
                      <TableRow key={backup.attributes.uuid}>
                        <TableCell>{backup.attributes.name || 'Backup'}</TableCell>
                        <TableCell>{backup.attributes.bytes === 0 ? 'Pending' : formatBytes(backup.attributes.bytes)}</TableCell>
                        <TableCell>{formatDate(backup.attributes.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getBackupStatus(backup) === 'Creating' && (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {getBackupStatus(backup)}
                          </div>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={!backup.attributes.is_successful}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <ConfirmDialog
                            title="Delete Backup"
                            description="Are you sure you want to delete this backup? This action cannot be undone."
                            confirmText="Delete"
                            variant="destructive"
                            onConfirm={() => handleDeleteBackup(backup)}
                            trigger={
                              <Button
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            }
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Create a new backup of your server. This may take some time depending on the size of your server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} className="text-white hover:text-white">
              Cancel
            </Button>
            <Button onClick={handleCreateBackup} disabled={createLoading}>
              {createLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupsPage;
