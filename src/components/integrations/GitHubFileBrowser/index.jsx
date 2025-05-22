import React, { useState, useEffect } from 'react';
import { useGitHub } from '../../../contexts/GitHubContext';
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

function GitHubFileBrowser({ open, onClose }) {
  const { githubConfig, fetchContents, fetchFileContent } = useGitHub();
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Load contents when component mounts, branch changes, or path changes
  useEffect(() => {
    if (open && githubConfig.isConnected) {
      loadContents();
    }
  }, [open, githubConfig.isConnected, githubConfig.selectedBranch, currentPath]);

  const loadContents = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchContents(currentPath);
      
      if (result.success) {
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

  const handleImportComplete = () => {
    // Clear selected files after successful import
    setSelectedFiles([]);
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
