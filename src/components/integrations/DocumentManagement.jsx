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
  Select,
  Checkbox,
  FormControlLabel,
  Paper
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import ErrorIcon from '@mui/icons-material/Error';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useDocument } from '../../contexts/DocumentContext';
import { useTeam } from '../../contexts/TeamContext';
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

  // DEBUG: Log the documents array to verify global docs are present
  React.useEffect(() => {
    // Only log when documents change
    // eslint-disable-next-line no-console
    console.log('[DEBUG] All documents:', documents);
  }, [documents]);
  
  const { 
    documentBrowserOpen, 
    openDocumentBrowser, 
    closeDocumentBrowser,
    selectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    batchUploadOpen,
    openBatchUpload,
    closeBatchUpload
  } = useDocument();
  
  const { selectedTeam } = useTeam();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isBatchUpload, setIsBatchUpload] = useState(false);
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showDocumentTypeField, setShowDocumentTypeField] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadError, setError] = useState(null);
  const [isGlobalDocument, setIsGlobalDocument] = useState(false);

  // File input ref for resetting
  const fileInputRef = React.useRef(null);

  // Confirmation dialog for test data generator template upload
  const [showTestDataWarning, setShowTestDataWarning] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  
  // Document browser state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  
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
      fetchDocuments(null, selectedTeam?.name);
      fetchDocumentTypes();
    }
  }, [isConnected, fetchDocuments, fetchDocumentTypes, selectedTeam]);

  // Filter documents when category changes
  useEffect(() => {
    if (selectedCategory && documents && Array.isArray(documents)) {
      const filtered = documents.filter(doc => 
        selectedCategory && selectedCategory.id === 'general' 
          ? !AGENTS.some(agent => doc.document_type.includes(agent.name))
          : selectedCategory && doc.document_type.includes(selectedCategory.name)
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
      setIsBatchUpload(false);
      
      // Show document type field if in general category
      if (selectedCategory && selectedCategory.type === 'general') {
        setShowDocumentTypeField(true);
      } else {
        setShowDocumentTypeField(false);
      }
    }
  };

  // State for batch upload confirmation
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // Handle folder selection for batch upload
  const handleFolderSelect = (event) => {
    // Clear any previous pending files first
    setPendingFiles([]);
    
    if (event.target.files && event.target.files.length > 0) {
      // Filter out .DS_Store files and other hidden files
      const filesArray = Array.from(event.target.files).filter(file => 
        !file.name.startsWith('.') && file.name !== '.DS_Store'
      );
      
      // If there are files after filtering, show confirmation
      if (filesArray.length > 0) {
        setPendingFiles(filesArray);
        setShowBatchConfirm(true);
      } else {
        // No valid files after filtering
        setError("No valid files found in the selected folder.");
      }
    }
  };

  // Confirm batch upload
  const confirmBatchUpload = () => {
    setSelectedFiles(pendingFiles);
    setIsBatchUpload(true);
    
    // Show document type field if in general category
    if (selectedCategory && selectedCategory.type === 'general') {
      setShowDocumentTypeField(true);
    } else {
      setShowDocumentTypeField(false);
    }
    
    setShowBatchConfirm(false);
  };

  // File input ref for batch upload
  const batchFileInputRef = React.useRef(null);

  // Cancel batch upload
  const cancelBatchUpload = () => {
    setPendingFiles([]);
    setShowBatchConfirm(false);
    
    // Reset file input so user can select the same folder again
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
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
        fetchDocuments(null, selectedTeam?.name);
        fetchDocumentTypes();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [documentBrowserOpen, fetchDocuments, fetchDocumentTypes, selectedTeam]);

  // Close document browser
  const handleCloseDocumentBrowser = () => {
    closeDocumentBrowser();
    setSelectedCategory(null);
    setSelectedFile(null);
    setSelectedDocumentType(null); // Reset selected document type when closing the modal
  };

  // Handle category selection
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  // Handle document upload
  const handleUploadDocument = async () => {
    if ((!selectedFile && !isBatchUpload) || 
        (isBatchUpload && selectedFiles.length === 0) || 
        !selectedCategory) return;

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

      if (isBatchUpload && selectedFiles.length > 0) {
        // Batch upload
        const results = [];
        const errors = [];
        
        for (const file of selectedFiles) {
          try {
            const result = await uploadDocument(
              file, 
              documentType, 
              isGlobalDocument ? null : selectedTeam?.name, 
              isGlobalDocument
            );
            if (result) {
              results.push(result);
            } else {
              errors.push(`Failed to upload ${file.name}`);
            }
          } catch (err) {
            errors.push(`Error uploading ${file.name}: ${err.message}`);
          }
        }
        
        if (errors.length > 0) {
          setError(`Some files failed to upload: ${errors.join(', ')}`);
        }
        
        // Reset form state
        setSelectedFiles([]);
        setIsBatchUpload(false);
        setShowDocumentTypeField(false);
        setSelectedDocumentType('');
        setCustomDocumentType('');
        setIsGlobalDocument(false);
      } else {
        // Single file upload
        const result = await uploadDocument(
          selectedFile, 
          documentType, 
          isGlobalDocument ? null : selectedTeam?.name, 
          isGlobalDocument
        );

        if (result) {
          // Reset form state
          setSelectedFile(null);
          setShowDocumentTypeField(false);
          setSelectedDocumentType('');
          setCustomDocumentType('');
          setIsGlobalDocument(false);
        } else {
          // If uploadDocument returned null but didn't throw an error,
          // there might be an error message in the SupabaseContext
          if (error) {
            setError(error);
          } else {
            setError('Failed to upload document. Please try again.');
          }
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
    setDocumentsToDelete([]);
    setDeleteConfirmOpen(true);
  };

  // Open batch delete confirmation dialog
  const handleOpenBatchDeleteConfirm = () => {
    if (selectedDocuments.length === 0) return;
    
    // Find the document objects for the selected IDs
    const docsToDelete = documents.filter(doc => 
      selectedDocuments.includes(doc.id)
    );
    
    setDocumentToDelete(null);
    setDocumentsToDelete(docsToDelete);
    setDeleteConfirmOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDocumentToDelete(null);
    setDocumentsToDelete([]);
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    try {
      setUploading(true); // Use the uploading state to indicate deletion in progress
      
      if (documentToDelete) {
        // Single document deletion
        await deleteDocument(documentToDelete.id, documentToDelete.document_url, selectedTeam?.name);
      } else if (documentsToDelete.length > 0) {
        // Batch document deletion
        const errors = [];
        
        for (const doc of documentsToDelete) {
          try {
            await deleteDocument(doc.id, doc.document_url, selectedTeam?.name);
          } catch (err) {
            console.error(`Error deleting document ${doc.id}:`, err);
            errors.push(`Error deleting ${doc.document_url.split('/').pop()}: ${err.message || 'Unknown error'}`);
          }
        }
        
        if (errors.length > 0) {
          setError(`Some documents failed to delete: ${errors.join(', ')}`);
        }
        
        // Reset selected documents
        clearDocumentSelection();
        setSelectAllChecked(false);
      }
    } catch (error) {
      console.error('Error in document deletion:', error);
      setError(error.message || 'Failed to delete document(s). Please try again.');
    } finally {
      setUploading(false);
      handleCloseDeleteConfirm();
    }
  };

  // Handle document selection for batch delete
  const handleDocumentSelect = (document) => {
    toggleDocumentSelection(document.id);
  };

  // Handle select all documents
  const handleSelectAll = () => {
    selectAllDocuments();
    
    // Update the select all checkbox state
    const visibleDocs = selectedCategory && selectedCategory.id !== 'general' 
      ? filteredDocuments 
      : documents.filter(doc => doc.document_type === selectedDocumentType);
      
    setSelectAllChecked(selectedDocuments.length < visibleDocs.length);
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

  // Get document types with documents for folder structure
  const getDocumentTypesWithDocuments = () => {
    if (!documents || !Array.isArray(documents)) return [];
    
    // Get all document types that have at least one document
    const typesWithDocs = {};
    
    documents.forEach(doc => {
      // Skip agent templates
      if (AGENTS.some(agent => doc.document_type.includes(agent.name))) {
        return;
      }
      // Only include general documents if:
      // - doc.team is null (global) OR
      // - doc.team matches the selected team (team-specific)
      if (doc.team === null || (selectedTeam && doc.team === selectedTeam.name)) {
        if (!typesWithDocs[doc.document_type]) {
          typesWithDocs[doc.document_type] = {
            name: doc.document_type,
            documents: []
          };
        }
        typesWithDocs[doc.document_type].documents.push(doc);
      }
    });
    
    return Object.values(typesWithDocs);
  };
  
  // State for selected document type in folder view
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  
  // Render document list (right side of browser)
  const renderDocumentList = () => {
    // DEBUG: Log current filter state and filtered docs
    React.useEffect(() => {
      // Only log when relevant state changes
      // eslint-disable-next-line no-console
      const filteredDocs = (selectedCategory && selectedCategory.id !== 'general'
        ? filteredDocuments
        : documents.filter(
            doc =>
              doc.document_type === selectedDocumentType &&
              (
                doc.team === null ||
                (selectedTeam && doc.team === selectedTeam.name)
              )
          )
      );
      console.log('[DEBUG] renderDocumentList:', {
        selectedCategory,
        selectedDocumentType,
        filteredDocs,
        documents,
      });
    }, [selectedCategory, selectedDocumentType, filteredDocuments, documents, selectedTeam]);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0 // Prevents the header from shrinking
        }}>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              {selectedCategory && selectedCategory.id === 'general' && selectedDocumentType 
                ? selectedDocumentType 
                : selectedCategory && selectedCategory.name}
            </Typography>
            {selectedTeam && (
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
                (Team: {selectedTeam.name})
              </span>
            )}
          </Box>
          <Box sx={{ ml: 3, display: 'flex', gap: 1 }}>
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
              <>
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
                {/* Only show batch upload for general documentation, not for agent templates */}
                {selectedCategory.type === 'general' && (
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
                {selectedDocuments.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenBatchDeleteConfirm}
                    sx={{ 
                      borderColor: 'rgba(244,67,54,0.5)',
                      '&:hover': {
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244,67,54,0.1)'
                      }
                    }}
                  >
                    Delete Selected ({selectedDocuments.length})
                  </Button>
                )}
              </>
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
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFiles([]);
                    setIsBatchUpload(false);
                    setShowDocumentTypeField(false);
                    setSelectedDocumentType('');
                    setCustomDocumentType('');
                    setIsGlobalDocument(false);
                    // Reset file inputs so user can select the same file/folder again
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    if (batchFileInputRef.current) {
                      batchFileInputRef.current.value = '';
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

        {/* Content area with overflow */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* For General Documentation, show folder structure */}
          {selectedCategory && selectedCategory.id === 'general' && !selectedDocumentType ? (
            <>
              {/* Folder structure view */}
              {getDocumentTypesWithDocuments().length === 0 ? (
                <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                  No documents found in this category
                </Typography>
              ) : (
                <List sx={{ width: '100%', p: 0 }}>
                  {getDocumentTypesWithDocuments().map((docType) => (
                    <ListItem 
                      key={docType.name} 
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        onClick={() => setSelectedDocumentType(docType.name)}
                        sx={{
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        <FolderIcon sx={{ mr: 2, color: '#4caf50' }} />
                        <ListItemText 
                          primary={docType.name} 
                          secondary={`${docType.documents.length} document${docType.documents.length !== 1 ? 's' : ''}`}
                          primaryTypographyProps={{ 
                            sx: { 
                              color: '#fff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
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
              )}
            </>
          ) : (
            <>
              {/* Document list view */}
              {(selectedCategory && selectedCategory.id !== 'general' ? filteredDocuments : 
                documents.filter(doc => doc.document_type === selectedDocumentType)).length === 0 ? (
                <Box>
                  {selectedCategory && selectedCategory.id === 'general' && selectedDocumentType && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        startIcon={<FolderIcon />}
                        onClick={() => setSelectedDocumentType(null)}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        Back to folders
                      </Button>
                    </Box>
                  )}
                  <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                    No documents found in this category
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {selectedCategory && selectedCategory.id === 'general' && selectedDocumentType && (
                    <Box sx={{ mb: 2 }}>
                      <Button
                        startIcon={<FolderIcon />}
                        onClick={() => setSelectedDocumentType(null)}
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        Back to folders
                      </Button>
                    </Box>
                  )}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                            }}
                          />
                        }
                        label="Select All"
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                      />
                      {selectedDocuments.length > 0 && (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {selectedDocuments.length} selected
                        </Typography>
                      )}
                    </Box>
                    <List sx={{ width: '100%', p: 0 }}>
                      {(selectedCategory && selectedCategory.id !== 'general'
                        ? filteredDocuments
                        : documents.filter(
                            doc =>
                              doc.document_type === selectedDocumentType &&
                              (
                                doc.team === null ||
                                (selectedTeam && doc.team === selectedTeam.name)
                              )
                          )
                      ).map((doc) => {
                        // Extract file name from URL
                        const fileName = doc.document_url.split('/').pop().split('_').slice(1).join('_');
                        const isSelected = selectedDocuments.some(selectedDoc => selectedDoc.id === doc.id);
                        
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
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Only show the sidebar summary if the modal is open */}
      {documentBrowserOpen ? null : null}

      {/* Document Browser Dialog */}
      {/* Document Browser Dialog - You can adjust the width by changing the minWidth value below */}
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
            minWidth: '1350px', // Change this value to adjust the width of the modal
            height: '65vh'
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
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Left side - Categories */}
            <Grid item xs={3} sx={{ 
              borderRight: '1px solid rgba(255,255,255,0.1)',
              height: '100%',
              overflow: 'auto'
            }}>
              {renderCategories()}
            </Grid>
            
            {/* Right side - Document list */}
            <Grid item xs={9} sx={{ 
              height: '100%',
              overflow: 'auto'
            }}>
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
          {documentToDelete ? (
            <Typography>
              Are you sure you want to delete this document? This action cannot be undone.
            </Typography>
          ) : (
            <Typography>
              Are you sure you want to delete {documentsToDelete.length} selected document{documentsToDelete.length !== 1 ? 's' : ''}? This action cannot be undone.
            </Typography>
          )}
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

      {/* Batch Upload Confirmation Dialog */}
      <Dialog
        open={showBatchConfirm}
        onClose={cancelBatchUpload}
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      >
        <DialogTitle>Batch Upload</DialogTitle>
        <DialogContent>
          <Typography>
            Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} to this category?
          </Typography>
          <Box sx={{ mt: 2, maxHeight: '200px', overflowY: 'auto' }}>
            {pendingFiles.slice(0, 10).map((file, index) => (
              <Typography key={index} variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                • {file.name}
              </Typography>
            ))}
            {pendingFiles.length > 10 && (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                ...and {pendingFiles.length - 10} more files
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={cancelBatchUpload}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBatchUpload}
            color="primary"
            variant="contained"
          >
            Upload
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
