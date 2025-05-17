import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useDocument } from '../../contexts/DocumentContext';
import DocumentManagement from './DocumentManagement';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

function SupabaseIntegration() {
  const { 
    isConnected, 
    connectionError, 
    supabaseUrl, 
    supabaseKey, 
    setSupabaseUrl, 
    setSupabaseKey, 
    connectToSupabase, 
    disconnectFromSupabase,
    loading
  } = useSupabase();
  
  const { openDocumentBrowser } = useDocument();
  
  // Get the fetchDocuments and fetchDocumentTypes functions from the Supabase context
  const { fetchDocuments, fetchDocumentTypes } = useSupabase();
  
  const [configOpen, setConfigOpen] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Form state - initialize with current config values
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);
  
  // Local error state for form validation
  const [formError, setFormError] = useState('');

  const handleOpenConfig = () => {
    // Update form state with current config values
    setUrl(supabaseUrl);
    setKey(supabaseKey);
    setConfigOpen(true);
    setFormError('');
    setSuccess('');
  };

  const handleCloseConfig = () => {
    setConfigOpen(false);
  };

  const handleConnect = async () => {
    // Validate inputs
    if (!url || !key) {
      setFormError('All fields are required');
      return;
    }
    
    setFormError('');
    
    // Use the context function to connect
    const result = await connectToSupabase(url, key);
    
    if (result) {
      setSuccess('Successfully connected to Supabase!');
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setConfigOpen(false);
        setSuccess('');
      }, 1500);
    }
  };

  // Update form fields when config changes
  useEffect(() => {
    if (!isConnected) {
      setUrl(supabaseUrl);
      setKey(supabaseKey);
    }
  }, [supabaseUrl, supabaseKey, isConnected]);

  const handleDisconnect = () => {
    disconnectFromSupabase();
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          Supabase
          {isConnected && (
            <Tooltip title="Connected">
              <CheckCircleIcon sx={{ ml: 1, fontSize: '1rem', color: 'success.main' }} />
            </Tooltip>
          )}
        </Typography>
        <Box>
          {isConnected ? (
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={handleDisconnect}
              sx={{ mr: 1, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Disconnect
            </Button>
          ) : null}
          <IconButton 
            size="small" 
            onClick={handleOpenConfig}
            sx={{ color: '#fff' }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {isConnected ? (
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="body2" sx={{ mb: 0.5, color: 'rgba(255,255,255,0.7)' }}>
            Connected to:
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {supabaseUrl}
          </Typography>
          
          <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Manage your document repository:
          </Typography>
          <Button 
            variant="outlined" 
            fullWidth
            size="small" 
            onClick={() => {
              // Open the document browser immediately
              openDocumentBrowser();
              
              // Then fetch the data (this will be handled in the DocumentManagement component)
            }}
            sx={{ 
              mt: 1,
              borderColor: 'rgba(255,255,255,0.3)', 
              color: '#fff',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Manage Documents
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
            Not connected
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleOpenConfig}
            sx={{ 
              borderColor: 'rgba(255,255,255,0.3)', 
              color: '#fff',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Connect to Supabase
          </Button>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog 
        open={configOpen} 
        onClose={handleCloseConfig}
        maxWidth="sm"
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
          Supabase Configuration
          <IconButton onClick={handleCloseConfig} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {(formError || connectionError) && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
              icon={<ErrorIcon sx={{ color: '#f44336' }} />}
            >
              {formError || connectionError}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50' }}
              icon={<CheckCircleIcon sx={{ color: '#4caf50' }} />}
            >
              {success}
            </Alert>
          )}
          
          {isConnected && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}
            >
              You are currently connected to Supabase. To modify connection details, please disconnect first.
            </Alert>
          )}
          
          <TextField
            label="Supabase URL"
            placeholder="https://your-project.supabase.co"
            fullWidth
            margin="normal"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading || isConnected}
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
            helperText="Example: https://your-project.supabase.co"
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
          
          <TextField
            label="Supabase API Key"
            fullWidth
            margin="normal"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={loading || isConnected}
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
            helperText="Use the service role key or anon key from your Supabase project settings"
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseConfig} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
            disabled={loading}
          >
            Cancel
          </Button>
          
          {isConnected ? (
            <Button 
              onClick={() => {
                handleDisconnect();
                handleCloseConfig();
              }} 
              variant="contained" 
              color="error"
              disabled={loading}
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
    {/* Mount the DocumentManagement modal so it can be opened via context */}
    <DocumentManagement />
    </>
  );
}

export default SupabaseIntegration;
