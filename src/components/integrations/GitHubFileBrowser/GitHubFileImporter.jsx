import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../../contexts/SupabaseContext';
import { useTeam } from '../../../contexts/TeamContext';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

function GitHubFileImporter({ selectedFiles, onImportComplete }) {
  const { supabase, documentTypes, fetchDocumentTypes, isConnected } = useSupabase();
  const { selectedTeam } = useTeam();
  const [documentType, setDocumentType] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch document types when component mounts
  useEffect(() => {
    if (isConnected && documentTypes.length === 0) {
      fetchDocumentTypes();
    }
  }, [isConnected, documentTypes.length, fetchDocumentTypes]);

  // Reset state when selected files change
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setImportedCount(0);
    setTotalCount(0);
  }, [selectedFiles]);

  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
  };

  const handleGlobalChange = (event) => {
    setIsGlobal(event.target.checked);
  };

  const handleImport = async () => {
    // Validate inputs
    if (!documentType) {
      setError('Please select a document type');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('No files selected for import');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedCount(0);
    setTotalCount(selectedFiles.length);

    try {
      // Import each file
      for (const file of selectedFiles) {
        try {
          // Create document record in Supabase
          const { error: insertError } = await supabase
            .from('document')
            .insert([
              {
                document_type: documentType,
                document_url: file.url,
                document_text: file.content,
                SHA: file.sha,
                team: !TEAM_USE_ENABLED || isGlobal ? null : selectedTeam?.name
              }
            ]);

          if (insertError) {
            console.error('Error importing file:', file.name, insertError);
            continue;
          }

          setImportedCount(prev => prev + 1);
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
        }
      }

      setSuccess(`Successfully imported ${importedCount} of ${selectedFiles.length} files`);
      
      // Notify parent component that import is complete
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 2, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50' }}
        >
          {success}
        </Alert>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
        Selected Files: {selectedFiles.length}
      </Typography>

      <FormControl 
        fullWidth 
        variant="outlined" 
        sx={{ mb: 2 }}
        size="small"
      >
        <InputLabel 
          id="document-type-label"
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Document Type
        </InputLabel>
        <Select
          labelId="document-type-label"
          value={documentType}
          onChange={handleDocumentTypeChange}
          label="Document Type"
          disabled={loading}
          sx={{
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
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1e1e1e',
                color: '#fff',
                '& .MuiMenuItem-root:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                },
                '& .MuiMenuItem-root.Mui-selected:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.3)',
                },
              },
            },
          }}
        >
          {documentTypes.map((type) => (
            <MenuItem key={type.id} value={type.name}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {TEAM_USE_ENABLED && selectedTeam && (
        <FormControlLabel
          control={
            <Checkbox 
              checked={isGlobal} 
              onChange={handleGlobalChange} 
              disabled={loading}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Make documents global (available to all teams)
            </Typography>
          }
          sx={{ mb: 2 }}
        />
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
        onClick={handleImport}
        disabled={loading || selectedFiles.length === 0 || !documentType}
        fullWidth
      >
        {loading ? `Importing (${importedCount}/${totalCount})` : 'Import Selected Files'}
      </Button>
    </Box>
  );
}

export default GitHubFileImporter;
