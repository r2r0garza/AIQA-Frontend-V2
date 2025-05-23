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
  const { supabase, documentTypes, fetchDocumentTypes, isConnected, fetchDocuments } = useSupabase();
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

  // Helper function to extract file path from GitHub URL
  const extractFilePathFromUrl = (url) => {
    let filePath = '';
    
    if (url) {
      // Extract the path from GitHub URL
      // GitHub URLs typically look like: https://github.com/owner/repo/blob/branch/path/to/file.js
      // or https://api.github.com/repos/owner/repo/contents/path/to/file.js
      
      // First, try to extract the full path from the URL
      const githubPathMatch = url.match(/\/blob\/[^/]+\/(.+)$/);
      if (githubPathMatch && githubPathMatch[1]) {
        filePath = githubPathMatch[1];
      } else {
        // Try API URL format
        const apiPathMatch = url.match(/\/contents\/(.+)(\?|$)/);
        if (apiPathMatch && apiPathMatch[1]) {
          filePath = apiPathMatch[1];
        } else {
          // Fallback: just use the filename from the end of the URL
          const fileNameMatch = url.match(/\/([^/]+)$/);
          if (fileNameMatch && fileNameMatch[1]) {
            filePath = fileNameMatch[1];
          }
        }
      }
    }
    
    return filePath;
  };

  const handleImport = async () => {
    // Debug: confirm function is called and show connection state
    // console.log('[DEBUG] handleImport called');
    // console.log('[DEBUG] Supabase client:', supabase);
    // console.log('[DEBUG] isConnected:', isConnected);

    // Validate inputs
    if (!documentType) {
      setError('Please select a document type');
      alert('[DEBUG] No document type selected');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('No files selected for import');
      alert('[DEBUG] No files selected for import');
      return;
    }

    // --- Robust error handling and connection check ---
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase. Please check your connection and try again.');
      alert('[DEBUG] Not connected to Supabase');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportedCount(0);
    setTotalCount(selectedFiles.length);

    // Track successfully imported files
    const successfulImports = [];
    // Use a local counter to track imported files
    let localImportedCount = 0;

    try {
      // Import each file
      for (const file of selectedFiles) {
        try {
          // Debug: log the data being sent to Supabase
          {/*console.log('[DEBUG] Preparing to import file:', {
            document_type: documentType,
            document_url: file.url,
            document_text: file.content,
            SHA: file.sha,
            team: !TEAM_USE_ENABLED || isGlobal ? null : selectedTeam?.name
          });*/}

          // Strict matching: only skip if both document_url and SHA match
          const { data: urlMatchDocs, error: urlMatchError } = await supabase
            .from('document')
            .select('id, SHA, document_url, document_text')
            .eq('document_url', file.url);

          // console.log('[DEBUG] urlMatchDocs:', urlMatchDocs, 'urlMatchError:', urlMatchError);

          if (urlMatchError) {
            console.error('Error checking for existing document by exact URL:', urlMatchError);
          }

          let foundExactDuplicate = false;
          let foundUrlMatchWithDifferentSha = false;
          let urlMatchDocId = null;

          if (urlMatchDocs && urlMatchDocs.length > 0) {
            for (const doc of urlMatchDocs) {
              // console.log('[DEBUG] Comparing doc:', doc, 'with file:', file);
              if (doc.SHA === file.sha) {
                foundExactDuplicate = true;
                break;
              } else {
                foundUrlMatchWithDifferentSha = true;
                urlMatchDocId = doc.id;
              }
            }
          }

          if (foundExactDuplicate) {
            // console.log(`[DEBUG] Document already exists with same URL and SHA, skipping`);
            // Still consider it a successful import for UI purposes
            successfulImports.push(file);
            localImportedCount++;
            setImportedCount(localImportedCount);
            continue;
          }

          if (foundUrlMatchWithDifferentSha && urlMatchDocId) {
            // Update the existing document with new content and SHA
            // console.log(`[DEBUG] Updating existing document with new SHA: ${file.sha}`);
            const { data: updateData, error: updateError } = await supabase
              .from('document')
              .update({
                document_text: file.content,
                SHA: file.sha
              })
              .eq('id', urlMatchDocId)
              .select();

            // console.log('[DEBUG] updateData:', updateData, 'updateError:', updateError);

            if (updateError) {
              console.error('Error updating document:', updateError);
              setError(`Error updating document: ${updateError.message}`);
              alert(`[DEBUG] Error updating document: ${updateError.message}`);
              continue;
            }

            // console.log('[DEBUG] Document updated successfully:', updateData);

            // Add to successful imports
            successfulImports.push(file);
            localImportedCount++;
            setImportedCount(localImportedCount);
            continue;
          }

          // No exact URL match, insert a new document
          // console.log(`[DEBUG] Creating new document record for "${file.path}"`);

          const { data: insertData, error: insertError } = await supabase
            .from('document')
            .insert([
              {
                document_type: documentType,
                document_url: file.url,
                document_text: file.content, // Store just the content, not the metadata
                SHA: file.sha, // Store the SHA for comparison
                team: !TEAM_USE_ENABLED || isGlobal ? null : selectedTeam?.name
              }
            ])
            .select();

          // console.log('[DEBUG] insertData:', insertData, 'insertError:', insertError);

          if (insertError) {
            console.error('Error importing file:', file.name, insertError);
            setError(`Error importing file "${file.name}": ${insertError.message}`);
            alert(`[DEBUG] Error importing file "${file.name}": ${insertError.message}`);
            continue;
          }

          // console.log('[DEBUG] Document inserted successfully:', insertData);

          // Add to successful imports
          successfulImports.push(file);
          localImportedCount++;
          setImportedCount(localImportedCount);
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
          setError(`Error processing file "${file.name}": ${fileError.message}`);
          alert(`[DEBUG] Error processing file "${file.name}": ${fileError.message}`);
        }
      }

      setSuccess(`Successfully imported ${localImportedCount} of ${selectedFiles.length} files`);

      // Refresh documents in SupabaseContext
      if (localImportedCount > 0) {
        try {
          // Use fetchDocuments from the context
          await fetchDocuments();
          // console.log('[DEBUG] Documents refreshed after import');
        } catch (refreshError) {
          console.error('Error refreshing documents:', refreshError);
          setError(`Error refreshing documents: ${refreshError.message}`);
          alert(`[DEBUG] Error refreshing documents: ${refreshError.message}`);
        }
      }

      // Notify parent component that import is complete with the list of imported files
      if (onImportComplete) {
        onImportComplete(successfulImports);
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      console.error('[DEBUG] Import failed:', err);
      alert(`[DEBUG] Import failed: ${err.message}`);
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
