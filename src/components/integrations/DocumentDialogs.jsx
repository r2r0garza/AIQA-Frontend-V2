import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import FolderIcon from '@mui/icons-material/Folder';
import DocumentViewer from '../DocumentViewer';

function DocumentDialogs({
  showTestDataWarning,
  setShowTestDataWarning,
  pendingUpload,
  setPendingUpload,
  doUpload,
  deleteConfirmOpen,
  handleCloseDeleteConfirm,
  documentToDelete,
  documentsToDelete,
  handleDeleteDocument,
  uploadError,
  setError,
  showBatchConfirm,
  cancelBatchUpload,
  confirmBatchUpload,
  pendingFiles,
  viewerOpen,
  handleCloseViewer,
  selectedDocument
}) {
  return (
    <>
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

      {/* Upload Error Alert */}
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

      {/* Document Viewer */}
      <DocumentViewer 
        open={viewerOpen}
        onClose={handleCloseViewer}
        documentUrl={selectedDocument?.document_url}
        documentText={selectedDocument?.document_text}
      />
    </>
  );
}

export default DocumentDialogs;
