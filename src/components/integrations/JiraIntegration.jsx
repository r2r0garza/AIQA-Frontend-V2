import React, { useState, useEffect } from 'react';
import { useJira } from '../../contexts/JiraContext';
import JiraProjectBrowser from './JiraProjectBrowser';
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
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

function JiraIntegration({ onIssueSelect }) {
  const { jiraConfig, connectToJira, disconnectFromJira } = useJira();
  const [configOpen, setConfigOpen] = useState(false);
  const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  
  // Form state - initialize with current config values
  const [jiraUrl, setJiraUrl] = useState(jiraConfig.url);
  const [email, setEmail] = useState(jiraConfig.email);
  const [token, setToken] = useState(jiraConfig.token);
  
  // Local error state for form validation
  const [formError, setFormError] = useState('');

  const handleOpenConfig = () => {
    // Update form state with current config values
    setJiraUrl(jiraConfig.url);
    setEmail(jiraConfig.email);
    setToken(jiraConfig.token);
    setConfigOpen(true);
    setFormError('');
    setSuccess('');
  };

  const handleCloseConfig = () => {
    setConfigOpen(false);
  };

  const handleConnect = async () => {
    // Validate inputs
    if (!jiraUrl || !email || !token) {
      setFormError('All fields are required');
      return;
    }
    
    // Validate Jira URL format
    if (!jiraUrl.match(/^https?:\/\/[a-zA-Z0-9-]+\.atlassian\.net\/?$/)) {
      setFormError('Invalid Jira URL format. Example: https://your-domain.atlassian.net');
      return;
    }
    
    setFormError('');
    
    // Use the context function to connect
    const result = await connectToJira(jiraUrl, email, token);
    
    if (result.success) {
      setSuccess('Successfully connected to Jira!');
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setConfigOpen(false);
        setSuccess('');
      }, 1500);
    }
  };

  // Update form fields when jiraConfig changes
  useEffect(() => {
    if (!jiraConfig.isConnected) {
      setJiraUrl(jiraConfig.url);
      setEmail(jiraConfig.email);
      setToken(jiraConfig.token);
    }
  }, [jiraConfig]);

  const handleDisconnect = () => {
    disconnectFromJira();
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          Jira
          {jiraConfig.isConnected && (
            <Tooltip title="Connected">
              <CheckCircleIcon sx={{ ml: 1, fontSize: '1rem', color: 'success.main' }} />
            </Tooltip>
          )}
        </Typography>
        <Box>
          {jiraConfig.isConnected ? (
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
            sx={{ color: '#fff', mr: 0.5 }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: '#fff' }}
          >
            {collapsed ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      
      {jiraConfig.isConnected && !collapsed ? (
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
            {jiraConfig.url}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.7)' }}>
            User:
          </Typography>
          <Typography variant="body2">
            {jiraConfig.email}
          </Typography>
          
          <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Select a project or issue to import:
          </Typography>
          <Button 
            variant="outlined" 
            fullWidth 
            size="small" 
            onClick={() => setProjectBrowserOpen(true)}
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
            Browse Projects
          </Button>
        </Box>
      ) : !jiraConfig.isConnected && (
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
            Connect to Jira
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
          Jira Configuration
          <IconButton onClick={handleCloseConfig} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {(formError || jiraConfig.error) && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
              icon={<ErrorIcon sx={{ color: '#f44336' }} />}
            >
              {formError || jiraConfig.error}
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
          
          {jiraConfig.isConnected && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' }}
            >
              You are currently connected to Jira. To modify connection details, please disconnect first.
            </Alert>
          )}
          
          <TextField
            label="Jira Server URL"
            placeholder="https://your-domain.atlassian.net"
            fullWidth
            margin="normal"
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            disabled={jiraConfig.loading || jiraConfig.isConnected}
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
            helperText="Example: https://your-domain.atlassian.net"
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
          
          <TextField
            label="User Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={jiraConfig.loading || jiraConfig.isConnected}
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
          
          <TextField
            label="API Token"
            fullWidth
            margin="normal"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={jiraConfig.loading || jiraConfig.isConnected}
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
            helperText="Generate an API token in your Atlassian account settings"
            FormHelperTextProps={{
              sx: { color: 'rgba(255,255,255,0.5)' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseConfig} 
            sx={{ color: 'rgba(255,255,255,0.7)' }}
            disabled={jiraConfig.loading}
          >
            Cancel
          </Button>
          
          {jiraConfig.isConnected ? (
            <Button 
              onClick={() => {
                handleDisconnect();
                handleCloseConfig();
              }} 
              variant="contained" 
              color="error"
              disabled={jiraConfig.loading}
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              onClick={handleConnect} 
              variant="contained" 
              disabled={jiraConfig.loading}
              startIcon={jiraConfig.loading ? <CircularProgress size={20} /> : null}
            >
              {jiraConfig.loading ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Project Browser Dialog */}
      <JiraProjectBrowser 
        open={projectBrowserOpen}
        onClose={() => setProjectBrowserOpen(false)}
        onSelect={(issue) => {
          if (onIssueSelect) {
            onIssueSelect(issue);
          }
          setProjectBrowserOpen(false);
        }}
      />
    </Box>
  );
}

export default JiraIntegration;
