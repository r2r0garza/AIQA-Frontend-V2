import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton,
  ListItemSecondaryAction, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  Tooltip,
  Divider,
  Link,
  Grid,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useDocument } from '../../contexts/DocumentContext';
import { AGENTS } from '../../constants';
import DocumentViewer from '../DocumentViewer';

function DocumentManagement() {
  const { 
    documents, 
    documentTypes, 
    loading, 
    error, 
    uploadDocument, 
    deleteDocument,
    addDocumentType,
    fetchDocumentTypes,
    fetchDocuments,
    isConnected
  } = useSupabase();
  const { documentBrowserOpen, openDocumentBrowser, closeDocumentBrowser } = useDocument();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showDocumentTypeField, setShowDocumentTypeField] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadError, setError] = useState(null);

  // File input ref for resetting
  const fileInputRef = React.useRef(null);

  // Confirmation dialog for test data generator template upload
  const [showTestDataWarning, setShowTestDataWarning] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  
  // Document browser state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  
  // No need to get documentTypes again, already destructured above
  
  // Create document categories
  const documentCategories = React.useMemo(() => {
    // Agent categories
    const agentCategories = AGENTS.filter(agent => !agent.hidden).map(agent => ({
      id: agent.id,
      name: `${agent.name} Template`,
      type: 'agent',
      icon: <DescriptionIcon sx={{ color: 'primary.main' }} />
    }));
    
    // Single general documentation category
    const generalCategory = {
      id: 'general',
      name: 'General Documentation',
      type: 'general',
      icon: <FolderIcon sx={{ color: '#4caf50' }} />
    };
    
    return [...agentCategories, generalCategory];
  }, []);

  // Fetch documents and document types when the component mounts
  useEffect(() => {
    if (isConnected) {
      fetchDocuments();
      fetchDocumentTypes();
    }
  }, [isConnected, fetchDocuments, fetchDocumentTypes]);

  // Filter documents when category changes
  useEffect(() => {
    if (selectedCategory && documents && Array.isArray(documents)) {
      const filtered = documents.filter(doc => 
        selectedCategory.id === 'general' 
          ? !AGENTS.some(agent => doc.document_type.includes(agent.name))
          : doc.document_type.includes(selectedCategory.name)
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments([]);
    }
  }, [selectedCategory, documents]);

  // Handle file selection
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      
      // Show document type field if in general category
      if (selectedCategory && selectedCategory.type === 'general') {
        setShowDocumentTypeField(true);
      } else {
        setShowDocumentTypeField(false);
      }
    }
  };

  // Open document browser
  const handleOpenDocumentBrowser = () => {
    // First open the browser immediately
    openDocumentBrowser();
    setSelectedCategory(null);
    setSelectedFile(null);
  };
  
  // Fetch data when the document browser is opened
  useEffect(() => {
    if (documentBrowserOpen) {
      // Use a small timeout to prevent UI glitches
      const timer = setTimeout(() => {
        fetchDocuments();
        fetchDocumentTypes();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [documentBrowserOpen, fetchDocuments, fetchDocumentTypes]);

  // Close document browser
  const handleCloseDocumentBrowser = () => {
    closeDocumentBrowser();
    setSelectedCategory(null);
    setSelectedFile(null);
  };

  // Handle category selection
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!selectedFile || !selectedCategory) return;

    // If uploading a template for the Test Data Generator agent, show warning
    if (
      selectedCategory.type === 'agent' &&
      selectedCategory.name.toLowerCase().includes('test data generator')
    ) {
      setShowTestDataWarning(true);
      setPendingUpload(true);
      return;
    }

    await doUpload();
  };

  // Actual upload logic, separated for confirmation dialog
  const doUpload = async () => {
    try {
      setUploading(true);
      setError(null);

      // Determine document type
      let documentType = selectedCategory.name;

      // For general category, use the selected or custom document type
      if (selectedCategory.type === 'general' && showDocumentTypeField) {
        if (selectedDocumentType === 'custom' && customDocumentType) {
          // Add the custom document type to the database
          await addDocumentType(customDocumentType, 'general');
          documentType = customDocumentType;
        } else if (selectedDocumentType) {
          documentType = selectedDocumentType;
        }
      }

      const result = await uploadDocument(selectedFile, documentType);

      if (result) {
        // Reset form state
        setSelectedFile(null);
        setShowDocumentTypeField(false);
        setSelectedDocumentType('');
        setCustomDocumentType('');
      } else {
        // If uploadDocument returned null but didn't throw an error,
        // there might be an error message in the SupabaseContext
        if (error) {
          setError(error);
        } else {
          setError('Failed to upload document. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
      setPendingUpload(false);
    }
  };

  // Open delete confirmation dialog
  const handleOpenDeleteConfirm = (document) => {
    setDocumentToDelete(document);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDocumentToDelete(null);
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      await deleteDocument(documentToDelete.id, documentToDelete.document_url);
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };
  
  // Open document viewer
  const handleOpenViewer = (document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };
  
  // Close document viewer
  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  // Group documents by type for the sidebar display
  const groupedDocuments = documents && Array.isArray(documents) 
    ? documents.reduce((acc, doc) => {
        if (!acc[doc.document_type]) {
          acc[doc.document_type] = [];
        }
        acc[doc.document_type].push(doc);
        return acc;
      }, {})
    : {};

  // Render document categories (left side of browser)
  const renderCategories = () => {
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {documentCategories.map((category) => (
          <ListItem key={category.id} disablePadding>
            <ListItemButton 
              onClick={() => handleSelectCategory(category)}
              selected={selectedCategory?.id === category.id}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.3)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Box sx={{ mr: 2 }}>{category.icon}</Box>
              <Tooltip title={category.name}>
                <ListItemText 
                  primary={category.name} 
                  primaryTypographyProps={{ 
                    sx: { 
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    } 
                  }}
                />
              </Tooltip>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };

  // Render document list (right side of browser)
  const renderDocumentList = () => {
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
          icon={<ErrorIcon sx={{ color: '#f44336' }} />}
        >
          {error}
        </Alert>
      );
    }

    return (
      <Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="h6" sx={{ color: '#fff', flexGrow: 1 }}>
            {selectedCategory.name}
          </Typography>
          <Box sx={{ ml: 3 }}>
            {selectedCategory?.type === 'agent' && filteredDocuments.length > 0 ? (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  disabled
                  sx={{ 
                    color: '#fff', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Upload File
                  <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#ff9800',
                    mt: 1,
                    maxWidth: 320,
                    fontWeight: 500
                  }}
                >
                  A template file has already been uploaded. To upload a new template, please delete the current template before uploading a new one.
                </Typography>
              </>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
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
                {uploading ? 'Uploading...' : 'Upload File'}
                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </Button>
            )}
          </Box>
        </Box>

        {uploadError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
            icon={<ErrorIcon sx={{ color: '#f44336' }} />}
            onClose={() => setError(null)}
          >
            {uploadError}
          </Alert>
        )}
        
        {selectedFile && (
          <Box sx={{ 
            mb: 2, 
            p: 1.5, 
            bgcolor: 'rgba(25, 118, 210, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(25, 118, 210, 0.3)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: showDocumentTypeField ? 2 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {selectedFile.name}
                </Typography>
              </Box>
              <Box>
                <Button 
                  size="small" 
                  color="inherit" 
                  onClick={() => {
                    setSelectedFile(null);
                    setShowDocumentTypeField(false);
                    setSelectedDocumentType('');
                    setCustomDocumentType('');
                    // Reset file input so user can select the same file again
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }}
                >
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleUploadDocument}
                  disabled={uploading || (showDocumentTypeField && !selectedDocumentType && !customDocumentType)}
                  startIcon={uploading ? <CircularProgress size={16} /> : null}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </Box>
            </Box>
            
            {/* Document Type Selection for General Category */}
            {showDocumentTypeField && (
              <Box sx={{ mt: 2 }}>
                {/* Debug info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Available types: {documentTypes && Array.isArray(documentTypes) 
                      ? documentTypes.filter(type => type.category === 'general').length 
                      : 0}
                  </Typography>
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={() => fetchDocumentTypes()}
                    sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}
                  >
                    Refresh Types
                  </Button>
                </Box>
                
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
              </Box>
            )}
          </Box>
        )}

        {filteredDocuments.length === 0 ? (
          <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
            No documents found in this category
          </Typography>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {filteredDocuments.map((doc) => {
              // Extract file name from URL
              const fileName = doc.document_url.split('/').pop().split('_').slice(1).join('_');
              
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
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        } 
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Only show the sidebar summary if the modal is open */}
      {documentBrowserOpen ? null : null}

      {/* Document Browser Dialog */}
      <Dialog 
        open={documentBrowserOpen} 
        onClose={handleCloseDocumentBrowser}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#fff',
            border: '1px solid #333',
            minWidth: '900px'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Document Management</Typography>
          <IconButton onClick={handleCloseDocumentBrowser} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Left side - Categories */}
            <Grid item xs={3} sx={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              {renderCategories()}
            </Grid>
            
            {/* Right side - Document list */}
            <Grid item xs={9}>
              {renderDocumentList()}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDocumentBrowser} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Data Generator Template Upload Warning Dialog */}
      <Dialog
        open={showTestDataWarning}
        onClose={() => {
          setShowTestDataWarning(false);
          setPendingUpload(false);
        }}
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle>Warning</DialogTitle>
        <DialogContent>
          <Typography>
            If a template is uploaded, the attached file for context will not be taken into consideration when creating test data. Do you wish to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowTestDataWarning(false);
              setPendingUpload(false);
            }}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            No
          </Button>
          <Button
            onClick={async () => {
              setShowTestDataWarning(false);
              await doUpload();
            }}
            color="error"
            variant="contained"
          >
            Yes, Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={handleCloseDeleteConfirm}
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this document? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteConfirm}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteDocument} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Viewer */}
      <DocumentViewer 
        open={viewerOpen}
        onClose={handleCloseViewer}
        documentUrl={selectedDocument?.document_url}
        documentText={selectedDocument?.document_text}
      />
    </Box>
  );
}

export default DocumentManagement;
