import React, { useState, useEffect, useCallback } from 'react';
import { useGitHub } from '../../../contexts/GitHubContext';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { useTeam } from '../../../contexts/TeamContext';
import GitHubBranchSelector from './GitHubBranchSelector';
import GitHubFileList from './GitHubFileList';
import GitHubFileImporter from './GitHubFileImporter';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

function GitHubFileBrowser({ open, onClose }) {
  const { githubConfig, fetchContents, fetchFileContent } = useGitHub();
  const { supabase, documents } = useSupabase();
  const { selectedTeam } = useTeam();
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importedFilesMap, setImportedFilesMap] = useState({});
  const [contentsCache, setContentsCache] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState({});
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Helper function to extract file path from GitHub URL
  const extractFilePathFromUrl = useCallback((url) => {
    let filePath = '';
    
    if (url) {
      // Extract the path from GitHub URL
      // GitHub URLs typically look like: https://github.com/owner/repo/blob/branch/path/to/file.js
      // or https://api.github.com/repos/owner/repo/contents/path/to/file.js
      
      // First, try to extract the full path from the URL
      const githubPathMatch = url.match(/\/blob\/[^/]+\/(.+)$/);
      if (githubPathMatch && githubPathMatch[1]) {
        filePath = githubPathMatch[1];
      } else {
        // Try API URL format
        const apiPathMatch = url.match(/\/contents\/(.+)(\?|$)/);
        if (apiPathMatch && apiPathMatch[1]) {
          filePath = apiPathMatch[1];
        } else {
          // Fallback: just use the filename from the end of the URL
          const fileNameMatch = url.match(/\/([^/]+)$/);
          if (fileNameMatch && fileNameMatch[1]) {
            filePath = fileNameMatch[1];
          }
        }
      }
    }
    
    return filePath;
  }, []);

  // Create a map of imported files with their SHAs when documents change
  useEffect(() => {
    if (documents && documents.length > 0) {
      const fileMap = {};
      
      console.log('Building imported files map from documents:', documents);
      
      documents.forEach(doc => {
        // Extract the path from the document_url
        const filePath = extractFilePathFromUrl(doc.document_url);
        
        if (filePath && doc.SHA) {
          // Store both by full path and by filename for more flexible matching
          fileMap[filePath] = doc.SHA;
          
          // Also store by just the filename (for backward compatibility)
          const fileName = filePath.split('/').pop();
          if (fileName) {
            fileMap[fileName] = doc.SHA;
          }
          
          console.log(`Mapped file "${filePath}" with SHA: ${doc.SHA}`);
        }
      });
      
      console.log('Final imported files map:', fileMap);
      setImportedFilesMap(fileMap);
    }
  }, [documents, extractFilePathFromUrl]);

  // Load contents when component mounts, branch changes, or path changes
  useEffect(() => {
    if (open && githubConfig.isConnected) {
      const cacheKey = `${githubConfig.selectedBranch}:${currentPath}`;
      const cachedData = contentsCache[cacheKey];
      const lastFetch = lastFetchTime[cacheKey] || 0;
      const now = Date.now();
      
      // Only fetch if:
      // 1. No cached data exists, or
      // 2. Cache has expired
      if (!cachedData || (now - lastFetch > CACHE_EXPIRY_TIME)) {
        loadContents();
      } else {
        // Use cached data
        console.log('Using cached GitHub contents for:', cacheKey);
        setContents(cachedData);
        setLoading(false);
        setError(null);
      }
    }
  }, [open, githubConfig.isConnected, githubConfig.selectedBranch, currentPath, contentsCache, lastFetchTime]);

  const loadContents = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchContents(currentPath);
      
      if (result.success) {
        // Store in cache
        const cacheKey = `${githubConfig.selectedBranch}:${currentPath}`;
        setContentsCache(prev => ({
          ...prev,
          [cacheKey]: result.data
        }));
        setLastFetchTime(prev => ({
          ...prev,
          [cacheKey]: Date.now()
        }));
        
        setContents(result.data);
      } else {
        setError(result.error);
        setContents([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load contents');
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path) => {
    setCurrentPath(path);
  };

  const handleToggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.path === file.path);
      
      if (isSelected) {
        return prev.filter(f => f.path !== file.path);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleFetchFileContent = async (path) => {
    try {
      return await fetchFileContent(path);
    } catch (err) {
      console.error('Error fetching file content:', err);
      return { success: false, error: err.message };
    }
  };
  
  const handleFetchContents = async (path) => {
    try {
      return await fetchContents(path);
    } catch (err) {
      console.error('Error fetching contents:', err);
      return { success: false, error: err.message };
    }
  };

  const handleImportComplete = (importedFiles) => {
    // Clear selected files after successful import
    setSelectedFiles([]);
    
    // Update importedFilesMap with newly imported files
    if (importedFiles && importedFiles.length > 0) {
      setImportedFilesMap(prev => {
        const newMap = { ...prev };
        
        importedFiles.forEach(file => {
          // Store by full path
          if (file.path) {
            newMap[file.path] = file.sha;
            
            // Also store by filename for backward compatibility
            const fileName = file.path.split('/').pop();
            if (fileName) {
              newMap[fileName] = file.sha;
            }
            
            console.log(`Added newly imported file to map: "${file.path}" with SHA: ${file.sha}`);
          }
        });
        
        return newMap;
      });
    }
  };

  const handleClose = () => {
    // Reset state when dialog closes
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          color: '#fff',
          border: '1px solid #333',
          height: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        GitHub Repository Browser
        <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
        {!githubConfig.isConnected ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please connect to GitHub first to browse repositories.
            </Alert>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Left side: File browser */}
            <Box sx={{ flex: 3, p: 2, borderRight: '1px solid rgba(255,255,255,0.1)', overflow: 'auto' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Repository: {githubConfig.url.split('/').slice(-2).join('/')}
              </Typography>
              
              <GitHubBranchSelector />
              
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <GitHubFileList
                contents={contents}
                loading={loading}
                error={error}
                currentPath={currentPath}
                onNavigate={handleNavigate}
                selectedFiles={selectedFiles}
                onToggleFileSelection={handleToggleFileSelection}
                onFetchFileContent={handleFetchFileContent}
                onFetchContents={handleFetchContents}
                importedFilesMap={importedFilesMap}
              />
            </Box>
            
            {/* Right side: Import panel */}
            <Box sx={{ flex: 2, p: 2, overflow: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Import Files
              </Typography>
              
              <GitHubFileImporter
                selectedFiles={selectedFiles}
                onImportComplete={handleImportComplete}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GitHubFileBrowser;
