import { Editor } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Binary,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit2,
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileJson,
  FilePlus,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  HardDrive,
  Home,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Maximize2,
  Minimize2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Card,
  CardContent
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { formatBytes } from '@/lib/format';

// Utility functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const getFileLanguage = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', json: 'json', xml: 'xml', html: 'html',
    css: 'css', md: 'markdown', yml: 'yaml', yaml: 'yaml', sh: 'shell',
    bash: 'shell', txt: 'plaintext', properties: 'properties', ini: 'ini',
    sql: 'sql', php: 'php', rb: 'ruby', rs: 'rust', go: 'go',
    c: 'c', cpp: 'cpp', cs: 'csharp'
  };
  return languageMap[ext] || 'plaintext';
};

const getFileIcon = (file, className = "h-4 w-4") => {
  if (!file?.is_file) return <Folder className={`${className} text-blue-500 fill-blue-500/20`} />;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'php', 'rb', 'go', 'rs', 'c', 'cpp', 'cs', 'html', 'css'];
  const archiveExts = ['zip', 'tar', 'gz', 'rar', '7z'];
  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  const audioExts = ['mp3', 'wav', 'ogg'];
  const videoExts = ['mp4', 'webm', 'mkv'];

  if (codeExts.includes(ext)) return <FileCode className={`${className} text-violet-500`} />;
  if (archiveExts.includes(ext)) return <Archive className={`${className} text-yellow-500`} />;
  if (imageExts.includes(ext)) return <FileImage className={`${className} text-pink-500`} />;
  if (audioExts.includes(ext)) return <FileAudio className={`${className} text-cyan-500`} />;
  if (videoExts.includes(ext)) return <FileVideo className={`${className} text-red-500`} />;
  if (file.mimetype?.includes('json')) return <FileJson className={`${className} text-green-500`} />;
  if (file.mimetype?.includes('text')) return <FileText className={`${className} text-orange-500`} />;
  if (['jar', 'exe', 'bin', 'dll'].includes(ext)) return <Binary className={`${className} text-purple-500`} />;

  return <File className={`${className} text-gray-500`} />;
};

const MAX_BACKEND_UPLOAD_BYTES = 40 * 1024 * 1024;
const MAX_FILE_MANAGER_UPLOAD_BYTES = 100 * 1024 * 1024;
const FOLDER_SIZE_CONCURRENCY = 2;

const FileManagerPage = () => {
  const { id } = useParams();

  // Core state
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [breadcrumbs, setBreadcrumbs] = useState(['/']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Selection state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Dialog states
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newItemType, setNewItemType] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameData, setRenameData] = useState({ oldName: '', newName: '' });
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Editor states
  const [editorContent, setEditorContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('plaintext');
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorSize, setEditorSize] = useState('large'); // 'large' | 'normal'
  const [folderSizes, setFolderSizes] = useState({});
  const [loadingFolderSizes, setLoadingFolderSizes] = useState({});
  const folderSizeRequestRef = useRef(0);
  const forceFolderSizeRefreshRef = useRef(false);

  // Path handling
  const normalizePath = useCallback((path) => {
    path = path.replace(/\/+/g, '/');
    return path.endsWith('/') ? path : `${path}/`;
  }, []);

  const joinPaths = useCallback((...paths) => {
    return normalizePath(paths.join('/'));
  }, [normalizePath]);

  // Error handling
  const handleError = useCallback((error, customMessage = null) => {
    console.error('Operation failed:', error);
    const message = customMessage || error?.response?.data?.error || error.message || 'Operation failed';
    setError(message);
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
      duration: 5000,
    });
  }, []);

  // Success handling
  const handleSuccess = useCallback((message) => {
    toast({
      title: "Success",
      description: message,
      duration: 3000,
    });
  }, []);

  // Compute folder stats
  const folderStats = useMemo(() => {
    const folders = files.filter(f => !f.is_file).length;
    const fileCount = files.filter(f => f.is_file).length;
    const totalSize = files.reduce((acc, file) => {
      if (file.is_file) {
        return acc + (file.size || 0);
      }

      const folderPath = joinPaths(currentPath, file.name);
      return acc + (folderSizes[folderPath] || 0);
    }, 0);
    return { folders, fileCount, totalSize };
  }, [files, folderSizes, joinPaths, currentPath]);

  // File operations
  const fetchFiles = useCallback(async (directory = '/') => {
    setIsLoading(true);
    setError(null);
    try {
      const normalizedPath = normalizePath(directory);
      const response = await fetch(`/api/server/${id}/files/list?directory=${encodeURIComponent(normalizedPath)}`);

      if (!response.ok) throw new Error(`Failed to fetch files: ${response.statusText}`);

      const data = await response.json();

      if (data.object === 'list') {
        // Sort: Folders first, then files. Alphabetical within groups.
        const sortedFiles = data.data.map(item => item.attributes).sort((a, b) => {
          if (a.is_file === b.is_file) {
            return a.name.localeCompare(b.name);
          }
          return a.is_file ? 1 : -1;
        });
        
        setFolderSizes({});
        setLoadingFolderSizes({});
        setFiles(sortedFiles);
        setCurrentPath(normalizedPath);

        const newBreadcrumbs = normalizedPath === '/'
          ? ['/']
          : ['/', ...normalizedPath.split('/').filter(Boolean)];
        setBreadcrumbs(newBreadcrumbs);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      handleError(err, 'Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [id, normalizePath, handleError]);

  useEffect(() => {
    const visibleFolders = files.filter(file => !file.is_file);

    if (visibleFolders.length === 0) {
      setFolderSizes({});
      setLoadingFolderSizes({});
      return;
    }

    const requestId = folderSizeRequestRef.current + 1;
    folderSizeRequestRef.current = requestId;
    const shouldForceRefresh = forceFolderSizeRefreshRef.current;
    forceFolderSizeRefreshRef.current = false;

    const folderEntries = visibleFolders.map((folder) => {
      const folderPath = joinPaths(currentPath, folder.name);
      return { name: folder.name, path: folderPath };
    });

    setLoadingFolderSizes(
      folderEntries.reduce((acc, folder) => {
        acc[folder.path] = true;
        return acc;
      }, {})
    );

    let cancelled = false;

    const fetchFolderSize = async (folder) => {
      const searchParams = new URLSearchParams({ directory: folder.path });

      if (shouldForceRefresh) {
        searchParams.set('refresh', '1');
      }

      try {
        const response = await fetch(`/api/server/${id}/files/folder-size?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to calculate folder size for ${folder.name}`);
        }

        const data = await response.json();

        if (cancelled || folderSizeRequestRef.current !== requestId) {
          return;
        }

        setFolderSizes((previous) => ({
          ...previous,
          [folder.path]: data?.attributes?.size || 0,
        }));
      } catch (error) {
        if (!cancelled && folderSizeRequestRef.current === requestId) {
          setFolderSizes((previous) => ({
            ...previous,
            [folder.path]: previous[folder.path] || 0,
          }));
        }
      } finally {
        if (!cancelled && folderSizeRequestRef.current === requestId) {
          setLoadingFolderSizes((previous) => ({
            ...previous,
            [folder.path]: false,
          }));
        }
      }
    };

    const runFolderSizeQueue = async () => {
      for (let index = 0; index < folderEntries.length; index += FOLDER_SIZE_CONCURRENCY) {
        const batch = folderEntries.slice(index, index + FOLDER_SIZE_CONCURRENCY);
        await Promise.all(batch.map((folder) => fetchFolderSize(folder)));

        if (cancelled || folderSizeRequestRef.current !== requestId) {
          return;
        }
      }
    };

    void runFolderSizeQueue();

    return () => {
      cancelled = true;
    };
  }, [files, currentPath, id, joinPaths]);

  const getDisplayedSize = useCallback((file) => {
    if (file.is_file) {
      return formatBytes(file.size);
    }

    const folderPath = joinPaths(currentPath, file.name);

    if (loadingFolderSizes[folderPath]) {
      return 'Calculating…';
    }

    return formatBytes(folderSizes[folderPath] || 0);
  }, [currentPath, folderSizes, joinPaths, loadingFolderSizes]);

  const handleFileView = useCallback(async (file) => {
    try {
      setIsLoading(true);
      const filePath = joinPaths(currentPath, file.name);
      const response = await fetch(`/api/server/${id}/files/contents?file=${encodeURIComponent(filePath)}`);

      if (!response.ok) throw new Error(`Failed to fetch file contents: ${response.statusText}`);

      const content = await response.text();
      setEditorLanguage(getFileLanguage(file.name));
      setEditorContent(content);
      setSelectedFile(file);
      setIsEditorDirty(false);
    } catch (err) {
      handleError(err, 'Failed to view file contents');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentPath, joinPaths, handleError]);

  const handleFileSave = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsSaving(true);
      const filePath = joinPaths(currentPath, selectedFile.name);
      const response = await fetch(`/api/server/${id}/files/write?file=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        body: editorContent
      });

      if (!response.ok) throw new Error(`Failed to save file: ${response.statusText}`);

      handleSuccess('File saved successfully');
      setIsEditorDirty(false);
      forceFolderSizeRefreshRef.current = true;
    } catch (err) {
      handleError(err, 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile, currentPath, id, editorContent, joinPaths, handleSuccess, handleError]);

  const handleNewItem = async () => {
    if (!newItemName.trim()) {
      handleError(new Error('Name cannot be empty'));
      return;
    }

    try {
      const normalizedPath = normalizePath(currentPath);

      if (newItemType === 'folder') {
        const response = await fetch(`/api/server/${id}/files/create-folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ root: normalizedPath, name: newItemName })
        });

        if (!response.ok) throw new Error(`Failed to create folder: ${response.statusText}`);
      } else {
        const filePath = joinPaths(currentPath, newItemName);
        const response = await fetch(`/api/server/${id}/files/write?file=${encodeURIComponent(filePath)}`, {
          method: 'POST',
          body: ' '
        });

        if (!response.ok) throw new Error(`Failed to create file: ${response.statusText}`);
      }

      handleSuccess(`${newItemType === 'folder' ? 'Folder' : 'File'} created successfully`);
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
      setShowNewDialog(false);
      setNewItemName('');
      setNewItemType(null);
    } catch (err) {
      handleError(err, `Failed to create ${newItemType}`);
    }
  };

  const handleFileRename = async () => {
    if (!renameData.newName.trim()) {
      handleError(new Error('New name cannot be empty'));
      return;
    }

    try {
      const normalizedPath = normalizePath(currentPath);
      const response = await fetch(`/api/server/${id}/files/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          root: normalizedPath,
          files: [{ from: renameData.oldName, to: renameData.newName }]
        })
      });

      if (!response.ok) throw new Error(`Failed to rename file: ${response.statusText}`);

      handleSuccess('File renamed successfully');
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
      setShowRenameDialog(false);
      setRenameData({ oldName: '', newName: '' });
    } catch (err) {
      handleError(err, 'Failed to rename file');
    }
  };

  const handleFileDelete = async (files) => {
    const fileList = Array.isArray(files) ? files : [files];

    try {
      const normalizedPath = normalizePath(currentPath);
      const response = await fetch(`/api/server/${id}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ root: normalizedPath, files: fileList })
      });

      if (!response.ok) throw new Error(`Failed to delete files: ${response.statusText}`);

      handleSuccess(fileList.length > 1 ? `${fileList.length} files deleted` : 'File deleted successfully');
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
      setSelectedFiles([]);
    } catch (err) {
      handleError(err, 'Failed to delete file(s)');
    }
  };

  const handleArchive = async (files) => {
    const fileList = Array.isArray(files) ? files : [files];

    try {
      const normalizedPath = normalizePath(currentPath);
      const response = await fetch(`/api/server/${id}/files/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ root: normalizedPath, files: fileList })
      });

      if (!response.ok) throw new Error(`Failed to create archive: ${response.statusText}`);

      handleSuccess('Files archived successfully');
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
      setShowArchiveDialog(false);
      setSelectedFiles([]);
    } catch (err) {
      handleError(err, 'Failed to archive files');
    }
  };

  const handleUnarchive = async (file) => {
    try {
      const normalizedPath = normalizePath(currentPath);
      const response = await fetch(`/api/server/${id}/files/decompress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ root: normalizedPath, file: file.name })
      });

      if (!response.ok) throw new Error(`Failed to unarchive file: ${response.statusText}`);

      handleSuccess('File unarchived successfully');
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
    } catch (err) {
      handleError(err, 'Failed to unarchive file');
    }
  };

  const downloadFile = async (file) => {
    try {
      const normalizedPath = normalizePath(currentPath);
      const filePath = joinPaths(normalizedPath, file.name);

      const response = await fetch(`/api/server/${id}/files/download?file=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Failed to get download URL: ${response.statusText}`);

      const data = await response.json();

      if (data.object === 'signed_url') {
        const link = document.createElement('a');
        link.href = data.attributes.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        handleSuccess('Download started');
      } else {
        throw new Error('Invalid download URL response');
      }
    } catch (err) {
      handleError(err, 'Failed to download file');
    }
  };

  const handleFileUpload = useCallback(async (filesToUpload) => {
    const files = Array.isArray(filesToUpload) ? filesToUpload : Array.from(filesToUpload);
    if (files.length === 0) return;

    try {
      setUploadProgress(0);
      setShowUploadDialog(true); // Show dialog to show progress
      setUploadingFiles(files.map(f => ({ name: f.name, size: f.size })));
      const normalizedPath = normalizePath(currentPath);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const totalUploadSize = files.reduce((total, file) => total + (file.size || 0), 0);

      if (totalUploadSize > MAX_FILE_MANAGER_UPLOAD_BYTES) {
        throw new Error(`This file is too large for the web file manager (${formatBytes(totalUploadSize)}). Please use SFTP for files larger than 100 MB.`);
      }

      const uploadViaBackend = () => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/server/${id}/files/upload?directory=${encodeURIComponent(normalizedPath)}`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
            return;
          }

          let message = `Upload failed with status: ${xhr.status}`;

          try {
            const payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            message = payload?.error || message;
          } catch (error) {
            if (xhr.status === 413) {
              message = `Upload rejected: ${formatBytes(totalUploadSize)} exceeds the dashboard upload limit.`;
            }
          }

          reject(new Error(message));
        };

        xhr.onerror = () => {
          reject(new Error(`Upload failed while sending ${formatBytes(totalUploadSize)} to the dashboard backend.`));
        };

        xhr.send(formData);
      });

      const uploadViaSignedUrl = async () => {
        const uploadUrlResponse = await fetch(`/api/server/${id}/files/upload?directory=${encodeURIComponent(normalizedPath)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' }
        });

        if (!uploadUrlResponse.ok) {
          throw new Error(`Failed to get upload URL: ${uploadUrlResponse.statusText}`);
        }

        const uploadUrlData = await uploadUrlResponse.json();

        if (uploadUrlData.object !== 'signed_url') {
          throw new Error('Invalid upload URL response');
        }

        const uploadUrl = new URL(uploadUrlData.attributes.url);
        uploadUrl.searchParams.set('directory', normalizedPath);

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadUrl.toString());

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
              return;
            }

            const message = xhr.status === 413
              ? `Upload rejected: ${formatBytes(totalUploadSize)} exceeds the remote file server upload limit.`
              : `Upload failed with status: ${xhr.status}`;
            reject(new Error(message));
          };

          xhr.onerror = () => {
            reject(new Error(`Direct upload failed for ${formatBytes(totalUploadSize)}. If your Wings node is behind CORS restrictions, set allowed-origins for the dashboard domain.`));
          };

          xhr.send(formData);
        });
      };

      if (totalUploadSize > MAX_BACKEND_UPLOAD_BYTES) {
        await uploadViaSignedUrl();
      } else {
        await uploadViaBackend();
      }

      handleSuccess(`${files.length} file(s) uploaded successfully`);
      forceFolderSizeRefreshRef.current = true;
      fetchFiles(normalizedPath);
      setShowUploadDialog(false);
      setUploadProgress(0);
      setUploadingFiles([]);
    } catch (err) {
      handleError(err);
      setUploadProgress(0);
      setShowUploadDialog(false);
      setUploadingFiles([]);
    }
  }, [currentPath, normalizePath, id, handleSuccess, fetchFiles, handleError]);

  // Navigation
  const handleNavigateToPath = useCallback((path) => {
    if (isEditorDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to navigate away?')) {
        setSelectedFile(null);
        setEditorContent('');
        setIsEditorDirty(false);
        fetchFiles(path);
      }
    } else {
      fetchFiles(path);
    }
  }, [isEditorDirty, fetchFiles]);

  const handleNavigateUp = useCallback(() => {
    if (currentPath === '/') return;
    const parentPath = currentPath.split('/').slice(0, -2).join('/') || '/';
    handleNavigateToPath(parentPath);
  }, [currentPath, handleNavigateToPath]);

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && selectedFile) {
        e.preventDefault();
        handleFileSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, handleFileSave]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  // Drag and Drop Handlers
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Render Helpers
  const renderFileActions = (file) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {file.is_file && (
          <>
            <DropdownMenuItem onClick={() => handleFileView(file)}>
              <FileText className="mr-2 h-4 w-4" /> View/Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadFile(file)}>
              <Download className="mr-2 h-4 w-4" /> Download
            </DropdownMenuItem>
            {file.name.match(/\.(zip|tar|gz|rar|7z)$/i) ? (
              <DropdownMenuItem onClick={() => handleUnarchive(file)}>
                <Archive className="mr-2 h-4 w-4" /> Extract
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleArchive(file.name)}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => {
          setRenameData({ oldName: file.name, newName: file.name });
          setShowRenameDialog(true);
        }}>
          <Edit2 className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => handleFileDelete(file.name)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Empty State Component
  const EmptyState = ({ isSearch }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-neutral-800/50 flex items-center justify-center">
          {isSearch ? (
            <Search className="h-10 w-10 text-neutral-500" />
          ) : (
            <FolderOpen className="h-10 w-10 text-neutral-500" />
          )}
        </div>
        {!isSearch && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Plus className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-neutral-200 mb-2">
        {isSearch ? 'No matching files found' : 'This folder is empty'}
      </h3>
      <p className="text-sm text-neutral-500 text-center max-w-sm mb-6">
        {isSearch 
          ? 'Try adjusting your search query or navigate to a different folder'
          : 'Upload files or create folders to get started. You can also drag and drop files here.'
        }
      </p>
      {!isSearch && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setNewItemType('file'); setShowNewDialog(true); }}>
            <FilePlus className="mr-2 h-4 w-4" />
            New File
          </Button>
          <Button variant="outline" onClick={() => { setNewItemType('folder'); setShowNewDialog(true); }}>
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        </div>
      )}
    </motion.div>
  );

  // Loading State Component
  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <p className="text-sm text-neutral-500">Loading files...</p>
    </motion.div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop container needs drag event handlers */}
      <div 
        className="min-h-screen p-4 md:p-6 flex flex-col space-y-4 relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md border-2 border-dashed border-primary rounded-lg flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <UploadCloud className="h-20 w-20 text-primary" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold mt-6 text-neutral-200">Drop files to upload</h2>
              <p className="text-sm text-neutral-500 mt-2">Release to add files to {currentPath === '/' ? 'root' : currentPath}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section - Improved with richer command bar */}
        <div className="flex flex-col gap-4">
          {/* Title and Stats Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">File Manager</h1>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {folderStats.folders} folders
                  </span>
                  <span className="flex items-center gap-1">
                    <File className="h-3 w-3" />
                    {folderStats.fileCount} files
                  </span>
                  {folderStats.totalSize > 0 && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatBytes(folderStats.totalSize)} total
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => fetchFiles(currentPath)} 
                    disabled={isLoading}
                    className="h-9 w-9"
                  >
                    <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9">
                    <Plus className="mr-2 h-4 w-4" /> New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setNewItemType('file'); setShowNewDialog(true); }}>
                    <FilePlus className="mr-2 h-4 w-4" /> New File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setNewItemType('folder'); setShowNewDialog(true); }}>
                    <Folder className="mr-2 h-4 w-4" /> New Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-9" onClick={() => setShowUploadDialog(true)}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload files to current folder</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Path Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-neutral-800/50">
            {/* Navigate Up Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNavigateUp}
                  disabled={currentPath === '/'}
                  className="h-8 w-8 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go to parent folder</TooltipContent>
            </Tooltip>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-thin">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 shrink-0 text-neutral-400 hover:text-primary"
                    onClick={() => handleNavigateToPath('/')}
                  >
                    <Home className="h-3 w-3 mr-1" />
                    root
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Go to root</TooltipContent>
              </Tooltip>
              
              {breadcrumbs.slice(1).map((crumb, index) => (
                <React.Fragment key={`crumb-${index}-${crumb}`}>
                  <ChevronRight className="h-3 w-3 text-neutral-600 shrink-0" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 shrink-0 text-neutral-400 hover:text-primary"
                        onClick={() => {
                          const path = normalizePath(`/${breadcrumbs.slice(1, index + 2).join('/')}`);
                          handleNavigateToPath(path);
                        }}
                      >
                        {crumb}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Navigate to /{breadcrumbs.slice(1, index + 2).join('/')}</TooltipContent>
                  </Tooltip>
                </React.Fragment>
              ))}
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  placeholder="Search files..."
                  className="pl-8 h-8 bg-neutral-800/50 border-neutral-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center border rounded-md bg-neutral-800/50 border-neutral-700">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 rounded-r-none"
                    >
                      <ListIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 rounded-l-none"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Area */}
        <Card className="flex-1 flex flex-col min-h-0 border-neutral-800/50">
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 h-full">
              <AnimatePresence mode="wait">
                {isLoading && files.length === 0 ? (
                  <LoadingState />
                ) : viewMode === 'list' ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {filteredFiles.length === 0 ? (
                      <EmptyState isSearch={!!searchQuery} />
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-neutral-800/50">
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={files.length > 0 && selectedFiles.length === files.length}
                                  onCheckedChange={(checked) => {
                                    setSelectedFiles(checked ? files.map(f => f.name) : []);
                                  }}
                                />
                              </TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead className="hidden md:table-cell w-28">Size</TableHead>
                              <TableHead className="hidden md:table-cell w-48">Modified</TableHead>
                              <TableHead className="hidden lg:table-cell w-40 pr-6">Permissions</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredFiles.map((file) => (
                              <TableRow
                                key={file.name}
                                className={`group border-neutral-800/30 hover:bg-neutral-800/30 ${selectedFiles.includes(file.name) ? 'bg-primary/5' : ''}`}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedFiles.includes(file.name)}
                                    onCheckedChange={(checked) => {
                                      setSelectedFiles(checked
                                        ? [...selectedFiles, file.name]
                                        : selectedFiles.filter(f => f !== file.name)
                                      );
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <button
                                    type="button"
                                    className="flex items-center gap-3 cursor-pointer select-none w-full text-left"
                                    onClick={() => {
                                      if (file.is_file) handleFileView(file);
                                      else handleNavigateToPath(joinPaths(currentPath, file.name));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        if (file.is_file) handleFileView(file);
                                        else handleNavigateToPath(joinPaths(currentPath, file.name));
                                      }
                                    }}
                                  >
                                    <div className="p-1.5 rounded-lg bg-neutral-800/50 group-hover:bg-neutral-700/50 transition-colors">
                                      {getFileIcon(file, "h-4 w-4")}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-neutral-200 group-hover:text-primary transition-colors">
                                        {file.name}
                                      </span>
                                      <span className="text-xs text-neutral-500 md:hidden">
                                        {getDisplayedSize(file)}
                                      </span>
                                    </div>
                                  </button>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-neutral-400">
                                  <span className="text-sm">{getDisplayedSize(file)}</span>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-neutral-400 pr-6">
                                  <span className="text-sm">{formatDate(file.modified_at)}</span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell pr-6">
                                  <code className="text-xs bg-neutral-800/70 px-2.5 py-1.5 rounded font-mono text-neutral-400 whitespace-nowrap">
                                    {file.mode}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  {renderFileActions(file)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                  >
                    {filteredFiles.length === 0 ? (
                      <div className="col-span-full">
                        <EmptyState isSearch={!!searchQuery} />
                      </div>
                    ) : (
                      filteredFiles.map((file) => (
                        <Card
                          key={file.name}
                          className={`
                            group cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 bg-neutral-900/30 border-neutral-800/30
                            ${selectedFiles.includes(file.name) ? 'border-primary bg-primary/5' : ''}
                          `}
                          onClick={() => {
                            if (file.is_file) handleFileView(file);
                            else handleNavigateToPath(joinPaths(currentPath, file.name));
                          }}
                        >
                          <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                            <div className="w-full flex justify-between items-start">
                              <Checkbox
                                checked={selectedFiles.includes(file.name)}
                                onCheckedChange={(checked) => {
                                  setSelectedFiles(checked
                                    ? [...selectedFiles, file.name]
                                    : selectedFiles.filter(f => f !== file.name)
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4"
                              />
                              <div className="-mr-2 -mt-1">
                                {renderFileActions(file)}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl bg-neutral-800/50 group-hover:bg-neutral-700/50 transition-colors">
                              {getFileIcon(file, "h-8 w-8")}
                            </div>
                            <div className="space-y-0.5 w-full">
                              <p className="font-medium text-sm text-neutral-200 truncate w-full" title={file.name}>
                                {file.name}
                              </p>
                                <p className="text-xs text-neutral-500">
                                  {getDisplayedSize(file)}
                                </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Bulk Actions Floating Bar */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
            >
              <Card className="shadow-xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      {selectedFiles.length} selected
                    </span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(selectedFiles)}
                          className="h-8"
                        >
                          <Archive className="h-4 w-4 mr-1.5" />
                          Archive
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Create a zip archive of selected files</TooltipContent>
                    </Tooltip>
                    
                    <ConfirmDialog
                      title="Delete Files"
                      description={`Are you sure you want to delete ${selectedFiles.length} file(s)? This action cannot be undone.`}
                      confirmText="Delete"
                      variant="destructive"
                      onConfirm={() => handleFileDelete(selectedFiles)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      }
                    />
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFiles([])}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear selection</TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogs */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Create New {newItemType === 'folder' ? 'Folder' : 'File'}
              </DialogTitle>
              <DialogDescription>
                Enter a name for the new {newItemType}. It will be created in the current directory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={newItemType === 'folder' ? 'New Folder' : 'file.txt'}
                  onKeyDown={(e) => e.key === 'Enter' && handleNewItem()}
                  className="font-mono"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
              <Button onClick={handleNewItem} disabled={!newItemName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Upload Files
              </DialogTitle>
              <DialogDescription>
                Drag and drop or select file(s) to upload to {currentPath === '/' ? 'root' : currentPath}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <button
                type="button"
                className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-neutral-800/30 transition-all group"
                onClick={() => document.getElementById('file-upload-dialog').click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById('file-upload-dialog').click();
                  }
                }}
                aria-label="Upload files by clicking or pressing Enter"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-neutral-800/50 group-hover:bg-primary/10 transition-colors">
                    <UploadCloud className="h-10 w-10 text-neutral-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-300">Click to browse</p>
                    <p className="text-xs text-neutral-500 mt-1">or drag and drop files here</p>
                  </div>
                </div>
                <input
                  id="file-upload-dialog"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </button>
              {uploadProgress > 0 && uploadingFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Uploading...</span>
                    <span className="text-neutral-400">{uploadProgress}%</span>
                  </div>
                  {uploadingFiles.length === 1 ? (
                    <div className="text-sm text-neutral-300 font-mono bg-neutral-800/50 rounded px-3 py-2 truncate">
                      {uploadingFiles[0].name} ({formatBytes(uploadingFiles[0].size)})
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-neutral-300 bg-neutral-800/50 rounded px-3 py-2">
                        <span className="font-medium">{uploadingFiles.length} files</span>
                        <span className="text-neutral-400"> ({formatBytes(uploadingFiles.reduce((t, f) => t + f.size, 0))} total)</span>
                      </div>
                      <ScrollArea className="h-24 rounded-md bg-neutral-800/30 border border-neutral-700/50">
                        <div className="p-2 space-y-1">
                          {uploadingFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-mono text-neutral-300 px-2">
                              <span className="truncate max-w-[280px]" title={file.name}>{file.name}</span>
                              <span className="text-neutral-400 ml-2 shrink-0">{formatBytes(file.size)}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  <Progress value={uploadProgress} className="w-full h-2" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-yellow-500" />
                Rename Item
              </DialogTitle>
              <DialogDescription>
                Enter a new name for "{renameData.oldName}"
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newName">New name</Label>
                <Input
                  id="newName"
                  value={renameData.newName}
                  onChange={(e) => setRenameData({ ...renameData, newName: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleFileRename()}
                  className="font-mono"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
              <Button onClick={handleFileRename} disabled={!renameData.newName.trim() || renameData.newName === renameData.oldName}>
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-yellow-500" />
                Create Archive
              </DialogTitle>
              <DialogDescription>
                {selectedFiles.length} file(s) will be archived into a zip file
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Archive className="h-4 w-4" />
                  <span>{selectedFiles.length} selected</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>Cancel</Button>
              <Button onClick={() => handleArchive(selectedFiles)}>
                <Archive className="mr-2 h-4 w-4" />
                Create Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editor Dialog - Enhanced with workspace framing */}
        <Dialog
          open={selectedFile !== null}
          onOpenChange={(open) => {
            if (!open && isEditorDirty) {
              if (window.confirm('You have unsaved changes. Close anyway?')) {
                setSelectedFile(null);
                setEditorContent('');
                setIsEditorDirty(false);
              }
            } else if (!open) {
              setSelectedFile(null);
              setEditorContent('');
            }
          }}
        >
          <DialogContent className={`flex flex-col p-0 gap-0 overflow-hidden bg-[#1e1e1e] border-neutral-800 [&>button]:hidden ${editorSize === 'large' ? 'w-[95vw] !max-w-[95vw] h-[90vh]' : 'w-[80vw] !max-w-5xl h-[60vh]'}`}>
            {/* Editor Header - Workspace Frame */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700 bg-[#252526]">
              <div className="flex items-center gap-3">
                {/* File Icon & Name */}
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile || {}, "h-5 w-5")}
                  <span className="font-medium text-white text-sm">{selectedFile?.name}</span>
                </div>
                
                {/* Unsaved Indicator */}
                {isEditorDirty && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 text-xs">
                    <Pencil className="h-3 w-3 mr-1" />
                    Unsaved
                  </Badge>
                )}
                
                {/* File Path */}
                <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-neutral-700">
                  <span className="text-xs text-neutral-500 font-mono">{currentPath}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Language Badge */}
                <Badge variant="secondary" className="hidden sm:flex bg-neutral-800 text-neutral-400 text-xs">
                  {editorLanguage}
                </Badge>
                
                {/* Size Toggle Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditorSize(prev => prev === 'large' ? 'normal' : 'large')}
                      className="text-neutral-400 hover:text-white hover:bg-white/10 h-8 w-8"
                    >
                      {editorSize === 'large' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {editorSize === 'large' ? 'Switch to normal size' : 'Switch to large size'}
                  </TooltipContent>
                </Tooltip>
                
                {/* Save Button */}
                <Button
                  variant={isEditorDirty ? "default" : "outline"}
                  size="sm"
                  onClick={handleFileSave}
                  disabled={!isEditorDirty || isSaving}
                  className={isEditorDirty ? "bg-white text-black hover:bg-white/90" : "bg-transparent text-neutral-300 hover:bg-neutral-700"}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (isEditorDirty) {
                      if (window.confirm('You have unsaved changes. Close anyway?')) {
                        setSelectedFile(null);
                        setEditorContent('');
                        setIsEditorDirty(false);
                      }
                    } else {
                      setSelectedFile(null);
                      setEditorContent('');
                    }
                  }}
                  className="text-neutral-400 hover:text-white hover:bg-white/10 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Editor Status Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-neutral-800 bg-[#252526] text-xs text-neutral-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Ready
                </span>
                <span>UTF-8</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Ln 1, Col 1</span>
                <span className="capitalize">{editorLanguage}</span>
              </div>
            </div>
            
            {/* Editor Content */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={editorLanguage}
                value={editorContent}
                onChange={(value) => {
                  setEditorContent(value || '');
                  setIsEditorDirty(true);
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                      <span className="text-neutral-500">Loading editor...</span>
                    </div>
                  </div>
                }
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading Overlay */}
        {isLoading && files.length > 0 && (
          <div className="fixed inset-0 bg-background/30 backdrop-blur-[2px] flex items-center justify-center z-50 pointer-events-none">
            <div className="flex items-center gap-3 bg-background border border-neutral-800 px-4 py-3 rounded-lg shadow-xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FileManagerPage;
