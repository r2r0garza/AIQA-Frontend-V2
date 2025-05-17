import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  CircularProgress,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { parseDocxContent, extractDocumentTitle } from '../utils/documentParser';
import ReactMarkdown from 'react-markdown';

function DocumentViewer({ open, onClose, documentUrl }) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [title, setTitle] = useState('Document Viewer');

  useEffect(() => {
    if (open && documentUrl) {
      loadDocument();
    } else {
      setContent('');
      setError('');
      setTitle('Document Viewer');
    }
  }, [open, documentUrl]);

  const loadDocument = async () => {
    if (!documentUrl) {
      setError('No document URL provided');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Extract file extension from URL
      const fileExtension = documentUrl.split('.').pop().toLowerCase();
      
      // Fetch the document content
      const response = await fetch(documentUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
      }
      
      // Process based on file type
      if (fileExtension === 'txt' || fileExtension === 'md') {
        // Text files can be processed directly
        const text = await response.text();
        setContent(text);
        setTitle(extractDocumentTitle(text));
      } else if (fileExtension === 'docx') {
        // For DOCX files, we'd need server-side processing
        // This is a simplified approach - in a real app, you'd use a library or API
        const text = await response.text();
        const formattedContent = parseDocxContent(text);
        setContent(formattedContent);
        setTitle(extractDocumentTitle(formattedContent));
      } else {
        // For other file types, provide a download link
        setContent(`This file type (${fileExtension}) cannot be previewed directly. Please download the file to view it.`);
        setTitle(`${documentUrl.split('/').pop()}`);
      }
    } catch (err) {
      console.error('Error loading document:', err);
      setError(`Error loading document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          color: '#fff',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          {title}
        </Typography>
        <Box>
          <IconButton 
            onClick={handleDownload} 
            sx={{ color: '#fff', mr: 1 }}
            disabled={!documentUrl}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      
      <DialogContent sx={{ bgcolor: '#1e1e1e' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ py: 2 }}>
            {error}
          </Typography>
        ) : (
          <Box sx={{ 
            fontFamily: 'monospace', 
            whiteSpace: 'pre-wrap', 
            p: 2,
            color: '#e0e0e0',
            maxHeight: '60vh',
            overflow: 'auto'
          }}>
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DocumentViewer;
