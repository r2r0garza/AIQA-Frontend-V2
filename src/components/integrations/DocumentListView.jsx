import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import { AGENTS } from '../../constants';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

function DocumentListView({
  documents,
  filteredDocuments,
  selectedCategory,
  selectedDocumentType,
  selectedTeam,
  selectAllChecked,
  selectedDocuments,
  handleSelectAll,
  handleDocumentSelect,
  handleOpenViewer,
  handleOpenDeleteConfirm,
  handleOpenBatchDeleteConfirm,
  handleSelectDocumentType,
  loading,
  error
}) {
  // If in general category and a folder is selected, show back button
  const handleBackToFolders = () => {
    handleSelectDocumentType(null);
  };

  // If in general category and no folder selected, show folder structure
  if (selectedCategory && selectedCategory.id === 'general' && !selectedDocumentType) {
    // Filter out agent templates and group by document_type
    const typesWithDocs = {};
    
    // Filter documents to exclude agent templates
    const generalDocs = documents.filter(doc => 
      !AGENTS.some(agent => doc.document_type.includes(agent.name))
    );
    
    generalDocs.forEach(doc => {
      if (!typesWithDocs[doc.document_type]) {
        typesWithDocs[doc.document_type] = [];
      }
      typesWithDocs[doc.document_type].push(doc);
    });
    const docTypes = Object.keys(typesWithDocs);

    if (docTypes.length === 0) {
      return (
        <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          No documents found in this category
        </Typography>
      );
    }

    return (
      <List sx={{ width: '100%', p: 0 }}>
        {docTypes.map((type) => (
          <ListItem 
            key={type} 
            disablePadding
            sx={{ mb: 1 }}
          >
            <ListItemButton
              onClick={() => handleSelectDocumentType(type)}
              sx={{
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <FolderIcon sx={{ mr: 2, color: '#4caf50' }} />
              <ListItemText 
                primary={type} 
                secondary={`${typesWithDocs[type].length} document${typesWithDocs[type].length !== 1 ? 's' : ''}`}
                primaryTypographyProps={{ 
                  sx: { 
                    color: '#fff',
                    overflowX: 'auto',
                    paddingBottom: '5px', // Add some padding to ensure text is not cut off by the scrollbar
                    '&::-webkit-scrollbar': {
                      height: '4px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderRadius: '4px'
                    }
                  } 
                }}
                secondaryTypographyProps={{
                  sx: { color: 'rgba(255,255,255,0.5)' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  }

  // Otherwise, show filtered document list
  const docsToShow = (selectedCategory && selectedCategory.id !== 'general'
    ? filteredDocuments
    : documents.filter(
        doc =>
          doc.document_type === selectedDocumentType &&
          (
            !TEAM_USE_ENABLED || // If team functionality is disabled, show all documents
            doc.team === null ||
            (selectedTeam && doc.team === selectedTeam.name)
          )
      )
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
        icon={<DeleteIcon sx={{ color: '#f44336' }} />}
      >
        {error}
      </Alert>
    );
  }

  if (!selectedCategory) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Select a category from the left
        </Typography>
        <DescriptionIcon sx={{ fontSize: '3rem', opacity: 0.5 }} />
      </Box>
    );
  }

  if (docsToShow.length === 0) {
    return (
      <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
        No documents found in this category
      </Typography>
    );
  }

  return (
    <Box>
      {selectedCategory && selectedCategory.id === 'general' && selectedDocumentType && (
        <Button
          variant="text"
          onClick={handleBackToFolders}
          sx={{ 
            mb: 2, 
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          ← Back to folders
        </Button>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={selectAllChecked}
                onChange={handleSelectAll}
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSvgIcon-root': { // Make the checkmark icon more visible
                    fontSize: '1.2rem',
                  },
                  '&.Mui-checked .MuiSvgIcon-root': {
                    color: 'primary.main',
                    visibility: 'visible',
                  }
                }}
              />
            }
            label="Select All"
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {selectedDocuments.length >= 2 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleOpenBatchDeleteConfirm}
              sx={{ 
                color: '#f44336',
                borderColor: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  borderColor: '#f44336',
                }
              }}
            >
              Delete Selected
            </Button>
          )}
          {selectedDocuments.length > 0 && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {selectedDocuments.length} selected
            </Typography>
          )}
        </Box>
      </Box>
      <List sx={{ width: '100%', p: 0 }}>
        {docsToShow.map((doc) => {
          // Robust file name extraction for GitHub and uploads
          let fileName = '';
          if (doc.document_url && doc.document_url.includes('github.com')) {
            fileName = doc.document_url.split('/').pop();
          } else if (doc.document_url) {
            fileName = doc.document_url.split('/').pop().split('_').slice(1).join('_');
          } else {
            fileName = 'Untitled';
          }
          const isSelected = selectedDocuments.includes(doc.id);

          return (
            <ListItem 
              key={doc.id} 
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  size="small" 
                  onClick={() => handleOpenDeleteConfirm(doc)}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
              sx={{ mb: 1 }}
            >
              <Checkbox 
                checked={isSelected}
                onChange={() => handleDocumentSelect(doc)}
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-checked': {
                    color: 'primary.main',
                  },
                  '& .MuiSvgIcon-root': { // Make the checkmark icon more visible
                    fontSize: '1.2rem',
                  },
                  '&.Mui-checked .MuiSvgIcon-root': {
                    color: 'primary.main',
                    visibility: 'visible',
                  }
                }}
              />
              <ListItemButton
                onClick={() => handleOpenViewer(doc)}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <DescriptionIcon sx={{ mr: 2, color: 'rgba(255,255,255,0.7)' }} />
                <ListItemText 
                  primary={fileName} 
                  primaryTypographyProps={{ 
                    sx: { 
                      color: '#fff',
                      overflowX: 'auto',
                      paddingBottom: '5px', // Add some padding to ensure text is not cut off by the scrollbar
                      '&::-webkit-scrollbar': {
                        height: '4px'
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        borderRadius: '4px'
                      }
                    } 
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default DocumentListView;
