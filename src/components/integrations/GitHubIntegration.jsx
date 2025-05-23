import React, { useState } from 'react';
import { useGitHub } from '../../contexts/GitHubContext';
import GitHubConfigModal from './GitHubConfigModal';
import GitHubFileBrowser from './GitHubFileBrowser';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

function GitHubIntegration() {
  const { githubConfig, disconnect } = useGitHub();
  const [configOpen, setConfigOpen] = useState(false);
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  
  // Get the GitHub URL from environment variables
  const envGitHubUrl = import.meta.env.VITE_GITHUB_AUTOMATION_FRAMEWORK_URL || '';
  const isUrlFromEnv = !!envGitHubUrl;

  const handleOpenConfig = () => {
    setConfigOpen(true);
  };

  const handleCloseConfig = () => {
    setConfigOpen(false);
  };
  
  const handleDisconnect = () => {
    disconnect();
  };

  const handleOpenFileBrowser = () => {
    setFileBrowserOpen(true);
  };

  const handleCloseFileBrowser = () => {
    setFileBrowserOpen(false);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          GitHub
          {githubConfig.isConnected && (
            <Tooltip title="Connected">
              <CheckCircleIcon sx={{ ml: 1, fontSize: '1rem', color: 'success.main' }} />
            </Tooltip>
          )}
        </Typography>
        <Box>
          {githubConfig.isConnected && !isUrlFromEnv && (
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={handleDisconnect}
              sx={{ mr: 1, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Disconnect
            </Button>
          )}
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

      {githubConfig.isConnected && !collapsed ? (
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
            {githubConfig.url}
          </Typography>

          <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Browse repository files:
          </Typography>
          {/*<Button
            variant="outlined"
            fullWidth
            size="small"
            startIcon={<FolderOpenIcon />}
            onClick={handleOpenFileBrowser}
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
            Browse Files
          </Button>*/}
        </Box>
      ) : !githubConfig.isConnected && (
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
            Connect to GitHub
          </Button>
        </Box>
      )}

      {/* Configuration Modal */}
      <GitHubConfigModal
        open={configOpen}
        onClose={handleCloseConfig}
      />

      {/* File Browser Modal */}
      <GitHubFileBrowser
        open={fileBrowserOpen}
        onClose={handleCloseFileBrowser}
      />
    </Box>
  );
}

export default GitHubIntegration;
