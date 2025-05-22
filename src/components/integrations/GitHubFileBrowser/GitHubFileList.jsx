import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Button,
  Tooltip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SelectAllIcon from '@mui/icons-material/DoneAll';

function GitHubFileList({
  contents,
  loading,
  error,
  currentPath,
  onNavigate,
  selectedFiles,
  onToggleFileSelection,
  onFetchFileContent,
  onFetchContents
}) {
  const [loadingFiles, setLoadingFiles] = useState({});
  const [loadingFolders, setLoadingFolders] = useState({});
  const [selectingAll, setSelectingAll] = useState(false);

  // Parse the current path into breadcrumb segments
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      // Root directory
      onNavigate('');
    } else {
      // Navigate to the specific path segment
      const newPath = pathSegments.slice(0, index + 1).join('/');
      onNavigate(newPath);
    }
  };

  // Handle folder click (navigation)
  const handleFolderClick = (item) => {
    const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    onNavigate(newPath);
  };

  // Handle folder selection (select all files in folder)
  const handleFolderSelect = async (item, event) => {
    event.stopPropagation(); // Prevent navigation into the folder
    
    const folderPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    setLoadingFolders(prev => ({ ...prev, [folderPath]: true }));
    
    try {
      await selectAllFilesInFolder(folderPath);
    } catch (err) {
      console.error('Error selecting folder:', err);
    } finally {
      setLoadingFolders(prev => ({ ...prev, [folderPath]: false }));
    }
  };

  // Helper function to add delay between API calls
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Select all files in the current directory (non-recursive)
  const selectFilesInCurrentDirectory = async () => {
    if (!contents || !Array.isArray(contents)) {
      return;
    }
    
    // Get only the files (not directories)
    const files = contents.filter(item => item.type === 'file');
    
    // Process each file
    for (const file of files) {
      // Skip if already selected
      if (selectedFiles.some(f => f.path === file.path)) {
        continue;
      }
      
      // Fetch and select the file
      const result = await onFetchFileContent(file.path);
      if (result.success) {
        onToggleFileSelection({
          ...file,
          content: result.data.content,
          sha: result.data.sha,
          url: result.data.url
        });
      }
      
      // Add delay between API calls
      await delay(1000);
    }
  };
  
  // Handle folder selection (select all files in folder)
  const selectAllFilesInFolder = async (folderPath) => {
    try {
      // Instead of navigating to the folder, we'll fetch its contents directly
      // We'll use the GitHub context's fetchContents function
      
      // First, get the current path to construct the full path
      const fullPath = folderPath;
      
      // Create a function to recursively process a folder
      const processFolder = async (path) => {
        // Fetch the contents of the folder
        const result = await onFetchContents(path);
        
        if (!result || !result.success || !Array.isArray(result.data)) {
          console.error(`Failed to fetch contents of folder ${path}`);
          return;
        }
        
        // Process each item in the folder
        for (const item of result.data) {
          if (item.type === 'file') {
            // If it's a file, fetch its content and select it if not already selected
            if (!selectedFiles.some(f => f.path === item.path)) {
              const fileResult = await onFetchFileContent(item.path);
              if (fileResult && fileResult.success) {
                onToggleFileSelection({
                  ...item,
                  content: fileResult.data.content,
                  sha: fileResult.data.sha,
                  url: fileResult.data.url
                });
              }
              // Add delay between API calls
              await delay(1000);
            }
          }
        }
      };
      
      // Process the folder
      await processFolder(fullPath);
    } catch (err) {
      console.error(`Error processing folder ${folderPath}:`, err);
    }
  };

  // Handle file selection
  const handleFileSelect = async (item) => {
    // Check if the file is already selected
    const isSelected = selectedFiles.some(f => f.path === item.path);
    
    if (isSelected) {
      // If already selected, just toggle selection
      onToggleFileSelection(item);
    } else {
      // If not selected, fetch content first
      setLoadingFiles(prev => ({ ...prev, [item.path]: true }));
      
      try {
        const result = await onFetchFileContent(item.path);
        
        if (result.success) {
          // Add file with content to selected files
          onToggleFileSelection({
            ...item,
            content: result.data.content,
            sha: result.data.sha,
            url: result.data.url
          });
        } else {
          console.error('Error fetching file content:', result.error);
        }
      } catch (err) {
        console.error('Error in file selection:', err);
      } finally {
        setLoadingFiles(prev => ({ ...prev, [item.path]: false }));
      }
    }
  };

  // Handle select all files in current directory
  const handleSelectAll = async () => {
    if (selectingAll || !contents || !Array.isArray(contents) || contents.length === 0) {
      return;
    }
    
    setSelectingAll(true);
    
    try {
      await selectFilesInCurrentDirectory();
    } catch (err) {
      console.error('Error selecting all files:', err);
    } finally {
      setSelectingAll(false);
    }
  };

  // Check if a file is selected
  const isFileSelected = (path) => {
    return selectedFiles.some(file => file.path === path);
  };

  // Sort contents: directories first, then files
  const sortedContents = contents && Array.isArray(contents) 
    ? [...contents].sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <Box>
      {/* Breadcrumb navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => handleBreadcrumbClick(-1)}
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { color: '#fff' }
          }}
        >
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          Root
        </Link>
        
        {pathSegments.map((segment, index) => (
          <Link
            key={index}
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => handleBreadcrumbClick(index)}
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: '#fff' }
            }}
          >
            {segment}
          </Link>
        ))}
      </Breadcrumbs>

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
        >
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Empty directory message */}
      {!loading && !error && sortedContents.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 3 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            This directory is empty
          </Typography>
        </Box>
      )}

      {/* Select All button */}
      {!loading && !error && sortedContents.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Tooltip title="Select all files in this directory">
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAll}
              disabled={selectingAll}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  bgcolor: 'rgba(255,255,255,0.05)'
                }
              }}
            >
              {selectingAll ? 'Selecting...' : 'Select All'}
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* File list */}
      {!loading && !error && sortedContents.length > 0 && (
        <List sx={{ 
          bgcolor: 'rgba(0,0,0,0.2)', 
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '50vh',
          overflow: 'auto'
        }}>
          {sortedContents.map((item) => (
            <ListItem 
              key={item.path} 
              disablePadding
              divider
              sx={{ 
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              {item.type === 'dir' ? (
                // Directory item
                <ListItemButton
                  onClick={() => handleFolderClick(item)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      onClick={(e) => handleFolderSelect(item, e)}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 40, color: '#ffca28' }}>
                    <FolderIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      sx: { color: '#fff' }
                    }}
                  />
                  {loadingFolders[currentPath ? `${currentPath}/${item.name}` : item.name] && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
              ) : (
                // File item
                <ListItemButton
                  onClick={() => handleFileSelect(item)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={isFileSelected(item.path)}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 40, color: '#90caf9' }}>
                    <InsertDriveFileIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      sx: { color: '#fff' }
                    }}
                  />
                  {loadingFiles[item.path] && (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  )}
                </ListItemButton>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default GitHubFileList;
