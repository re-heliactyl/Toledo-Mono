import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw, Star } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const AllocationsPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/server/${id}/allocations`);
      setAllocations(response.data);
    } catch (err) {
      setError('Failed to fetch allocations. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllocation = async () => {
    setCreateLoading(true);
    try {
      const response = await axios.post(`/api/server/${id}/allocations`, {});
      setAllocations([...allocations, response.data]);
      toast({ title: "Success", description: "Allocation created successfully." });
    } catch (err) {
      const errorDetail = err.response?.data?.details?.errors?.[0]?.detail;
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorDetail || 'Failed to create allocation. Please try again later.' 
      });
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };
  const handleDeleteAllocation = async (allocation) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/server/${id}/allocations/${allocation.id}`);
      setAllocations(allocations.filter(a => a.id !== allocation.id));
      toast({ title: "Success", description: "Allocation deleted successfully." });
    } catch (err) {
      const errorDetail = err.response?.data?.details?.errors?.[0]?.detail;
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: errorDetail || 'Failed to delete allocation. Please try again later.' 
      });
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleSetPrimary = async (allocation) => {
    setPrimaryLoading(true);
    try {
      await axios.post(`/api/server/${id}/allocations/${allocation.id}/set-primary`);
      setAllocations(allocations.map(a => ({
        ...a,
        is_primary: a.id === allocation.id
      })));
      toast({ title: "Success", description: "Primary allocation updated." });
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to set primary allocation." 
      });
      console.error(err);
    } finally {
      setPrimaryLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [id]);



  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Network</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage IP and port allocations for this server.</p>
        </div>
        <ConfirmDialog
          trigger={
            <Button className="bg-white text-black hover:bg-neutral-200" disabled={createLoading}>
              {createLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              New allocation
            </Button>
          }
          title="Add Allocation"
          description="A new allocation with a random port will be added to the server."
          confirmText="Add Allocation"
          onConfirm={handleAddAllocation}
        />
      </div>
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="p-0">
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
                    <TableRow className="hover:bg-transparent border-neutral-800">
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Address</TableHead>
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Host</TableHead>
                      <TableHead className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Port</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((allocation) => (
                      <TableRow key={allocation.id} className="hover:bg-neutral-900/50 border-neutral-800">
                        <TableCell>
                          <div className="flex items-center space-x-2 py-1">
                            <span className="font-bold text-white text-sm">
                              {allocation.alias || allocation.ip}:{allocation.port}
                            </span>
                            {allocation.is_primary && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-none hover:bg-emerald-500/10 py-0 px-1.5 text-[9px] font-bold h-4">
                                PRIMARY
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-400 text-sm">{allocation.alias || allocation.ip}</TableCell>
                        <TableCell className="text-neutral-400 text-sm">{allocation.port}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-6">
                            {!allocation.is_primary && (
                              <button
                                onClick={() => handleSetPrimary(allocation)}
                                disabled={primaryLoading}
                                className="text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                              >
                                Set primary
                              </button>
                            )}
                            <ConfirmDialog
                              trigger={
                                <button
                                  disabled={allocation.is_primary || deleteLoading}
                                  className="text-sm text-red-400/80 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center"
                                >
                                  {deleteLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                  Delete
                                </button>
                              }
                              title="Delete Allocation"
                              description="Are you sure you want to delete this allocation?"
                              confirmText="Delete"
                              variant="destructive"
                              onConfirm={() => handleDeleteAllocation(allocation)}
                            />
                          </div>
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

export default AllocationsPage;
