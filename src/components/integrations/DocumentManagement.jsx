import React, { useState, useEffect, useRef } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useDocument } from '../../contexts/DocumentContext';
import { useTeam } from '../../contexts/TeamContext';
import { AGENTS } from '../../constants';
import DocumentCategorySidebar from './DocumentCategorySidebar';
import DocumentListView from './DocumentListView';
import DocumentUploadPanel from './DocumentUploadPanel';
import DocumentDialogs from './DocumentDialogs';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

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

  const { 
    documentBrowserOpen, 
    openDocumentBrowser, 
    closeDocumentBrowser,
    selectedDocuments,
    setSelectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    batchUploadOpen,
    openBatchUpload,
    closeBatchUpload
  } = useDocument();

  const { selectedTeam } = useTeam();

  // State for sidebar and list
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);

  // Upload panel state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isBatchUpload, setIsBatchUpload] = useState(false);
  const [customDocumentType, setCustomDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showDocumentTypeField, setShowDocumentTypeField] = useState(false);

  // Dialogs state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadError, setError] = useState(null);
  const [isGlobalDocument, setIsGlobalDocument] = useState(!TEAM_USE_ENABLED);
  const [showTestDataWarning, setShowTestDataWarning] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // File input refs
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  // Document categories
  const documentCategories = React.useMemo(() => {
    const agentCategories = AGENTS.filter(agent => !agent.hidden).map(agent => ({
      id: agent.id,
      name: `${agent.name} Template`,
      type: 'agent'
    }));
    const generalCategory = {
      id: 'general',
      name: 'General Documentation',
      type: 'general'
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

  // Update selectAllChecked state when selectedDocuments or visible documents change
  useEffect(() => {
    // Determine which documents are currently visible based on category and type
    const visibleDocs = selectedCategory && selectedCategory.id !== 'general' 
      ? filteredDocuments 
      : documents.filter(doc => doc.document_type === selectedDocumentType);
    
    // Get IDs of visible documents
    const visibleDocIds = visibleDocs.map(doc => doc.id);
    
    // Check if all visible documents are selected
    const allVisibleSelected = visibleDocIds.length > 0 && 
                              visibleDocIds.every(id => selectedDocuments.includes(id));
    
    setSelectAllChecked(allVisibleSelected);
  }, [selectedDocuments, filteredDocuments, documents, selectedCategory, selectedDocumentType]);

  // Upload panel handlers
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setIsBatchUpload(false);
      if (selectedCategory && selectedCategory.type === 'general') {
        setShowDocumentTypeField(true);
      } else {
        setShowDocumentTypeField(false);
      }
    }
  };

  const handleFolderSelect = (event) => {
    setPendingFiles([]);
    if (event.target.files && event.target.files.length > 0) {
      const filesArray = Array.from(event.target.files).filter(file => 
        !file.name.startsWith('.') && file.name !== '.DS_Store'
      );
      if (filesArray.length > 0) {
        setPendingFiles(filesArray);
        setShowBatchConfirm(true);
      } else {
        setError("No valid files found in the selected folder.");
      }
    }
  };

  const confirmBatchUpload = () => {
    setSelectedFiles(pendingFiles);
    setIsBatchUpload(true);
    if (selectedCategory && selectedCategory.type === 'general') {
      setShowDocumentTypeField(true);
    } else {
      setShowDocumentTypeField(false);
    }
    setShowBatchConfirm(false);
  };

  const cancelBatchUpload = () => {
    setPendingFiles([]);
    setShowBatchConfirm(false);
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setSelectedFiles([]);
    setIsBatchUpload(false);
    setShowDocumentTypeField(false);
    setSelectedDocumentType('');
    setCustomDocumentType('');
    setIsGlobalDocument(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (batchFileInputRef.current) batchFileInputRef.current.value = '';
  };

  // Document list handlers
  const handleSelectAll = () => {
    // Determine which documents are currently visible based on category and type
    const visibleDocs = selectedCategory && selectedCategory.id !== 'general' 
      ? filteredDocuments 
      : documents.filter(doc => doc.document_type === selectedDocumentType);
    
    // Get IDs of visible documents
    const visibleDocIds = visibleDocs.map(doc => doc.id);
    
    // Check if all visible documents are already selected
    const allVisibleSelected = visibleDocIds.length > 0 && 
                              visibleDocIds.every(id => selectedDocuments.includes(id));
    
    if (allVisibleSelected) {
      // If all visible docs are selected, clear selection
      clearDocumentSelection();
      setSelectAllChecked(false);
    } else {
      // Otherwise, select only the visible documents
      setSelectedDocuments(visibleDocIds);
      setSelectAllChecked(true);
    }
  };

  const handleDocumentSelect = (document) => {
    toggleDocumentSelection(document.id);
  };

  const handleOpenViewer = (document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  // Delete dialog handlers
  const handleOpenDeleteConfirm = (document) => {
    setDocumentToDelete(document);
    setDocumentsToDelete([]);
    setDeleteConfirmOpen(true);
  };

  const handleOpenBatchDeleteConfirm = () => {
    if (selectedDocuments.length === 0) return;
    const docsToDelete = documents.filter(doc => 
      selectedDocuments.includes(doc.id)
    );
    setDocumentToDelete(null);
    setDocumentsToDelete(docsToDelete);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDocumentToDelete(null);
    setDocumentsToDelete([]);
  };

  // Document delete handler
  const handleDeleteDocument = async () => {
    try {
      setError(null);

      if (documentToDelete) {
        // Single document delete
        const success = await deleteDocument(
          documentToDelete.id,
          documentToDelete.document_url,
          selectedTeam?.name
        );

        if (!success) {
          throw new Error("Failed to delete document");
        }
      } else if (documentsToDelete && documentsToDelete.length > 0) {
        // Batch delete
        const deletePromises = documentsToDelete.map(doc => 
          deleteDocument(
            doc.id,
            doc.document_url,
            selectedTeam?.name
          )
        );

        const results = await Promise.all(deletePromises);

        if (results.some(result => !result)) {
          throw new Error("Some documents failed to delete");
        }

        // Clear selected documents
        clearDocumentSelection();
      }

      // Close the confirmation dialog
      handleCloseDeleteConfirm();

      // Refresh the documents list
      await fetchDocuments(null, selectedTeam?.name);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.message);
    }
  };

  // Document upload handler
  const handleUploadDocument = async () => {
    if (!selectedFile && (!selectedFiles || selectedFiles.length === 0)) {
      setError("No file selected for upload");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Determine document type
      let docType = selectedDocumentType;
      if (selectedDocumentType === 'custom' && customDocumentType) {
        // Add the custom document type first
        const newType = await addDocumentType(customDocumentType, 'general');
        if (newType) {
          docType = newType.name;
        } else {
          throw new Error("Failed to create custom document type");
        }
      } else if (!docType && selectedCategory && selectedCategory.type === 'agent') {
        // For agent templates, use the agent name as the document type
        docType = selectedCategory.name;
      }

      if (!docType) {
        throw new Error("Document type is required");
      }

      // Handle single file upload
      if (selectedFile) {
        const result = await uploadDocument(
          selectedFile, 
          docType, 
          selectedTeam?.name, 
          isGlobalDocument
        );
        
        if (!result) {
          throw new Error("Failed to upload document");
        }
      } 
      // Handle batch upload
      else if (isBatchUpload && selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => 
          uploadDocument(
            file, 
            docType, 
            selectedTeam?.name, 
            isGlobalDocument
          )
        );
        
        const results = await Promise.all(uploadPromises);
        
        if (results.some(result => !result)) {
          throw new Error("Some files failed to upload");
        }
      }

      // Reset the form
      handleCancelUpload();
      
      // Refresh the documents list
      await fetchDocuments(null, selectedTeam?.name);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Dialog 
        open={documentBrowserOpen} 
        onClose={closeDocumentBrowser}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#121212',
            color: '#fff',
            border: '1px solid #333',
            minWidth: '900px',
            height: '65vh'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6">
              {selectedCategory ? selectedCategory.name : 'Document Management'}
              {selectedDocumentType && selectedCategory && selectedCategory.id === 'general' && 
                ` > ${selectedDocumentType}`}
            </Typography>
            {selectedTeam && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Current Team: {selectedTeam.name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={closeDocumentBrowser} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            <Grid item xs={3} sx={{ borderRight: '1px solid rgba(255,255,255,0.1)', height: '100%', overflow: 'auto' }}>
              <DocumentCategorySidebar
                documentCategories={documentCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={(category) => {
                  setSelectedCategory(category);
                  // If general, reset document type; if folder, set to folder name
                  if (category.id === 'general') {
                    setSelectedDocumentType(null);
                  } else {
                    setSelectedDocumentType(category.name);
                  }
                }}
              />
            </Grid>
            <Grid item xs={9} sx={{ height: '100%', overflow: 'auto' }}>
              <DocumentUploadPanel
                selectedFile={selectedFile}
                selectedFiles={selectedFiles}
                isBatchUpload={isBatchUpload}
                showDocumentTypeField={showDocumentTypeField}
                selectedCategory={selectedCategory}
                uploading={uploading}
                handleFileChange={handleFileChange}
                handleFolderSelect={handleFolderSelect}
                batchFileInputRef={batchFileInputRef}
                fileInputRef={fileInputRef}
                handleUploadDocument={handleUploadDocument}
                handleCancelUpload={handleCancelUpload}
                documentTypes={documentTypes}
                selectedDocumentType={selectedDocumentType}
                setSelectedDocumentType={setSelectedDocumentType}
                customDocumentType={customDocumentType}
                setCustomDocumentType={setCustomDocumentType}
                isGlobalDocument={isGlobalDocument}
                setIsGlobalDocument={setIsGlobalDocument}
                selectedTeam={selectedTeam}
                filteredDocuments={filteredDocuments}
                documents={documents}
              />
              <DocumentListView
                documents={documents}
                filteredDocuments={filteredDocuments}
                selectedCategory={selectedCategory}
                selectedDocumentType={selectedDocumentType}
                selectedTeam={selectedTeam}
                selectAllChecked={selectAllChecked}
                selectedDocuments={selectedDocuments}
                handleSelectAll={handleSelectAll}
                handleDocumentSelect={handleDocumentSelect}
                handleOpenViewer={handleOpenViewer}
                handleOpenDeleteConfirm={handleOpenDeleteConfirm}
                handleOpenBatchDeleteConfirm={handleOpenBatchDeleteConfirm}
                handleSelectDocumentType={setSelectedDocumentType}
                loading={loading}
                error={error}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={closeDocumentBrowser} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <DocumentDialogs
        showTestDataWarning={showTestDataWarning}
        setShowTestDataWarning={setShowTestDataWarning}
        pendingUpload={pendingUpload}
        setPendingUpload={setPendingUpload}
        doUpload={handleUploadDocument}
        deleteConfirmOpen={deleteConfirmOpen}
        handleCloseDeleteConfirm={handleCloseDeleteConfirm}
        documentToDelete={documentToDelete}
        documentsToDelete={documentsToDelete}
        handleDeleteDocument={handleDeleteDocument}
        uploadError={uploadError}
        setError={setError}
        showBatchConfirm={showBatchConfirm}
        cancelBatchUpload={cancelBatchUpload}
        confirmBatchUpload={confirmBatchUpload}
        pendingFiles={pendingFiles}
        viewerOpen={viewerOpen}
        handleCloseViewer={handleCloseViewer}
        selectedDocument={selectedDocument}
      />
    </Box>
  );
}

export default DocumentManagement;
