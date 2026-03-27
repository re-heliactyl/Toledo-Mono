import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const LogsPage = () => {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const paginationRef = useRef(pagination);

  const fetchLogs = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/server/${id}/logs`, {
        params: { page, limit }
      });

      // Handle the API response structure
      if (response.data && Array.isArray(response.data.data)) {
        setLogs(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        console.error('Unexpected API response format:', response.data);
        setError('Received unexpected data format from the server.');
      }
    } catch (err) {
      setError('Failed to fetch logs. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    fetchLogs(pagination.current_page, pagination.items_per_page);
  }, [fetchLogs, pagination.current_page, pagination.items_per_page]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const { current_page, items_per_page } = paginationRef.current;
      fetchLogs(current_page, items_per_page);
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs(pagination.current_page, pagination.items_per_page);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination((prev) => ({
        ...prev,
        current_page: newPage,
      }));
    }
  };

  const handleDownloadLogs = () => {
    // Create CSV content from logs
    const headers = ['Timestamp', 'Action', 'Details'];

    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.action || 'Unknown Action',
        log.details && typeof log.details === 'object'
          ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
          : (log.details ? `"${log.details.toString().replace(/"/g, '""')}"` : '')
      ].join(','))
    ].join('\n');

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `server_logs_${id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLogTypeColor = (action) => {
    // Define color mapping for different log types
    const logColors = {
      // Server state changes
      'server.start': 'text-green-500',
      'server.stop': 'text-red-500',
      'server.restart': 'text-yellow-500',
      'server.kill': 'text-red-600',

      // File operations
      'files.upload': 'text-blue-500',
      'files.download': 'text-blue-400',
      'files.delete': 'text-red-400',
      'files.create': 'text-green-400',
      'files.edit': 'text-yellow-400',
      'Write File': 'text-blue-400',

      // Backup operations
      'backup.create': 'text-green-500',
      'backup.delete': 'text-red-500',
      'backup.download': 'text-blue-500',

      // User actions
      'user.login': 'text-purple-500',
      'user.logout': 'text-purple-400',
      'user.failed_login': 'text-orange-500',

      // Settings changes
      'settings.update': 'text-cyan-500',

      // Default
      'default': 'text-gray-400'
    };

    return logColors[action] || logColors.default;
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return timestamp || "Unknown";
    }
  };

  // Format details for display
  const formatDetails = (details) => {
    if (!details) return '—';

    if (typeof details === 'object') {
      try {
        // Check if it's a file operation
        if (details.file) {
          return `File: ${details.file}`;
        }

        // For other object types, stringify
        return JSON.stringify(details);
      } catch (error) {
        console.error("Error formatting details:", error);
        return 'Error displaying details';
      }
    }

    return details.toString();
  };

  // Filter logs based on search query and filter type
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === '' ||
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (typeof log.details === 'object' && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())) ||
      (typeof log.details === 'string' && log.details.toLowerCase().includes(searchQuery.toLowerCase()));

    const actionLower = (log.action || '').toLowerCase();
    const matchesFilter = filterType === 'all' ||
      (filterType === 'server' && actionLower.includes('server')) ||
      (filterType === 'files' && (actionLower.includes('file') || actionLower.includes('write'))) ||
      (filterType === 'backup' && actionLower.includes('backup')) ||
      (filterType === 'user' && actionLower.includes('user')) ||
      (filterType === 'settings' && actionLower.includes('settings'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logs</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-neutral-800/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-base">Server activity logs</CardTitle>
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <ScrollArea className="h-[600px]">
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Timestamp</TableHead>
                      <TableHead className="w-1/4">Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          {searchQuery || filterType !== 'all'
                            ? 'No matching logs found.'
                            : 'No activity logs available.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={`${log.timestamp || 'unknown'}-${log.action || 'unknown'}-${typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '')}`}>
                          <TableCell className="whitespace-nowrap">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <span className={getLogTypeColor(log.action)}>
                              {log.action || 'Unknown Action'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatDetails(log.details)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table></div>
              </ScrollArea>

              {/* Pagination controls */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between space-x-2 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredLogs.length} of {pagination.total_items} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {pagination.current_page} of {pagination.total_pages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.total_pages || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;
