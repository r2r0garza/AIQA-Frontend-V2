import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

function DocumentUploadPanel({
  selectedFile,
  selectedFiles,
  isBatchUpload,
  showDocumentTypeField,
  selectedCategory,
  uploading,
  handleFileChange,
  handleFolderSelect,
  batchFileInputRef,
  fileInputRef,
  handleUploadDocument,
  handleCancelUpload,
  documentTypes,
  selectedDocumentType,
  setSelectedDocumentType,
  customDocumentType,
  setCustomDocumentType,
  isGlobalDocument,
  setIsGlobalDocument,
  selectedTeam,
  filteredDocuments,
  documents
}) {
  // Check if the selected agent already has a template
  const hasExistingTemplate = useMemo(() => {
    if (!selectedCategory || selectedCategory.type !== 'agent' || !documents) {
      return false;
    }
    
    return documents.some(doc => doc.document_type === selectedCategory.name);
  }, [selectedCategory, documents]);
  return (
    <>
      {selectedCategory && selectedCategory.type === 'agent' && hasExistingTemplate && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2, 
            bgcolor: 'rgba(33, 150, 243, 0.1)', 
            color: '#90caf9',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            '& .MuiAlert-icon': {
              color: '#90caf9'
            }
          }}
        >
          This agent already has a template. Only one template per agent is supported.
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={uploading || (selectedCategory?.type === 'agent' && hasExistingTemplate)}
          sx={{ 
            color: '#fff', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)'
            },
            '&.Mui-disabled': {
              color: 'rgba(255,255,255,0.3)',
              borderColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={selectedCategory?.type === 'agent' && hasExistingTemplate}
          />
        </Button>
        {selectedCategory && selectedCategory.type === 'general' && (
          <Button
            variant="outlined"
            component="label"
            startIcon={<CreateNewFolderIcon />}
            disabled={uploading}
            sx={{ 
              color: '#fff', 
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Batch Upload'}
            <input
              type="file"
              hidden
              multiple
              directory=""
              webkitdirectory=""
              ref={batchFileInputRef}
              onChange={handleFolderSelect}
            />
          </Button>
        )}
      </Box>
      {(selectedFile || (isBatchUpload && selectedFiles.length > 0)) && (
        <Box sx={{ 
          mb: 2, 
          p: 1.5, 
          bgcolor: 'rgba(25, 118, 210, 0.1)', 
          borderRadius: 1,
          border: '1px solid rgba(25, 118, 210, 0.3)',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showDocumentTypeField ? 2 : 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {isBatchUpload ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      {selectedFiles.length} files selected
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 4, maxHeight: '100px', overflowY: 'auto', width: '100%' }}>
                    {selectedFiles.slice(0, 5).map((file, index) => (
                      <Typography key={index} variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                        {file.name}
                      </Typography>
                    ))}
                    {selectedFiles.length > 5 && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                        ...and {selectedFiles.length - 5} more
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {selectedFile.name}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box>
              <Button 
                size="small" 
                color="inherit" 
                onClick={handleCancelUpload}
                sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }}
              >
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleUploadDocument}
                disabled={
                  uploading || 
                  (showDocumentTypeField && !selectedDocumentType && !customDocumentType) ||
                  (selectedCategory?.type === 'agent' && hasExistingTemplate)
                }
                startIcon={uploading ? <CircularProgress size={16} /> : null}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </Box>
          </Box>
          {/* Document Type Selection for General Category */}
          {showDocumentTypeField && (
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="document-type-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Document Type
                </InputLabel>
                <Select
                  labelId="document-type-label"
                  value={selectedDocumentType}
                  onChange={(e) => {
                    setSelectedDocumentType(e.target.value);
                    if (e.target.value !== 'custom') {
                      setCustomDocumentType('');
                    }
                  }}
                  label="Document Type"
                  sx={{ 
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a document type</em>
                  </MenuItem>
                  {documentTypes && Array.isArray(documentTypes) ? (
                    documentTypes
                      .filter(type => type.category === 'general')
                      .map(type => (
                        <MenuItem key={type.id} value={type.name}>
                          {type.name}
                        </MenuItem>
                      ))
                  ) : null}
                  <MenuItem value="custom">Add custom type...</MenuItem>
                </Select>
              </FormControl>
              {selectedDocumentType === 'custom' && (
                <TextField
                  fullWidth
                  margin="normal"
                  size="small"
                  label="Custom Document Type"
                  value={customDocumentType}
                  onChange={(e) => setCustomDocumentType(e.target.value)}
                  InputLabelProps={{
                    sx: { color: 'rgba(255,255,255,0.7)' }
                  }}
                  InputProps={{
                    sx: { 
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)'
                        },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
              )}
              
              {/* Team Toggle - only show if team functionality is enabled */}
              {TEAM_USE_ENABLED && selectedCategory && selectedCategory.type === 'general' && selectedTeam && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isGlobalDocument}
                      onChange={(e) => setIsGlobalDocument(!e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: 'primary.main',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {isGlobalDocument ? "Global Document (No Team)" : `Assign to Team: ${selectedTeam.name}`}
                    </Typography>
                  }
                  sx={{ mt: 2, display: 'block' }}
                />
              )}
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

export default DocumentUploadPanel;
