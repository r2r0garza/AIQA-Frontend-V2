import React, { useState, useEffect } from 'react';
import { useGitHub } from '../../contexts/GitHubContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function GitHubConfigModal({ open, onClose }) {
  const { githubConfig, connect, disconnect } = useGitHub();
  const [url, setUrl] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Get the GitHub URL from environment variables
  const envGitHubUrl = import.meta.env.VITE_GITHUB_AUTOMATION_FRAMEWORK_URL || '';
  const isUrlFromEnv = !!envGitHubUrl;

  // Initialize form values when the modal opens
  useEffect(() => {
    if (open) {
      setUrl(githubConfig.url || '');
      setPat(githubConfig.pat || '');
      setError(null);
      setSuccess(null);
    }
  }, [open, githubConfig]);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handlePatChange = (event) => {
    setPat(event.target.value);
  };

  const toggleShowPat = () => {
    setShowPat(!showPat);
  };

  const handleConnect = async () => {
    // Validate URL
    if (!url.trim()) {
      setError('GitHub repository URL is required');
      return;
    }

    // Check if URL is a valid GitHub repository URL
    const githubUrlPattern = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubUrlPattern.test(url)) {
      setError('Invalid GitHub repository URL. Format should be: https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await connect(url, pat);
      
      if (result.success) {
        setSuccess('Successfully connected to GitHub repository');
        // Close the modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to connect to GitHub');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setSuccess('Disconnected from GitHub repository');
    // Reset form
    if (!isUrlFromEnv) {
      setUrl('');
    } else {
      // If URL is from env var, we still want to show it in the field
      setUrl(envGitHubUrl);
    }
    setPat('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        GitHub Configuration
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
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
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
            Connect to a GitHub repository to import files as documents.
          </Typography>
          
          <TextField
            label="GitHub Repository URL"
            value={url}
            onChange={handleUrlChange}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={loading || (isUrlFromEnv && githubConfig.isConnected)}
            placeholder="https://github.com/owner/repo"
            helperText={isUrlFromEnv ? "URL is set from environment variable and cannot be changed" : ""}
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
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
          
          <TextField
            label="Personal Access Token (Optional)"
            value={pat}
            onChange={handlePatChange}
            fullWidth
            margin="normal"
            variant="outlined"
            disabled={loading}
            type={showPat ? 'text' : 'password'}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            helperText="Required for private repositories"
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
              },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={toggleShowPat}
                    edge="end"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {showPat ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {githubConfig.isConnected && (
          <Button 
            onClick={handleDisconnect}
            color="error"
            variant="outlined"
            disabled={loading || isUrlFromEnv}
            title={isUrlFromEnv ? "Cannot disconnect when URL is set in environment variables" : ""}
            sx={{ 
              mr: 'auto',
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.3)',
                borderColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Disconnect
            {isUrlFromEnv && (
              <Typography variant="caption" sx={{ ml: 1, fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
                (Env URL)
              </Typography>
            )}
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleConnect}
          variant="contained"
          color="primary"
          disabled={loading || (!url && !isUrlFromEnv)}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GitHubConfigModal;
