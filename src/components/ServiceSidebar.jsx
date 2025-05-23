import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  Divider
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import JiraIntegration from './integrations/JiraIntegration';
import GitHubIntegration from './integrations/GitHubIntegration';
import SupabaseIntegration from './integrations/SupabaseIntegration';
import TeamSelector from './TeamSelector';
import { useSupabase } from '../contexts/SupabaseContext';

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

function ServiceSidebar({ open, onToggle, onJiraIssueSelect }) {
  const { isConnected } = useSupabase();
  return (
    <Box sx={{ position: 'relative', height: '100vh', margin: 0, padding: 0 }}>
      <Paper
        elevation={3}
        sx={{
          width: open ? 305 : 0,
          minWidth: open ? 290 : 0,
          transition: 'width 0.2s',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          borderLeft: open ? '1px solid #333' : 'none',
          height: '100%',
          bgcolor: '#000',
          color: '#fff',
          borderRadius: 0,
          margin: 0,
          padding: 0
        }}
      >
        <Box sx={{ 
          flex: 1, 
          p: open ? 2 : 0, 
          display: open ? 'block' : 'none',
          overflowY: 'auto',
          maxHeight: '100vh'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>External Services</Typography>
          
          {/* Team Selector - only show if team functionality is enabled */}
          {TEAM_USE_ENABLED && (
            <>
              <TeamSelector />
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            </>
          )}
          
          {/* Jira Integration */}
          <JiraIntegration onIssueSelect={onJiraIssueSelect} />
          
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* GitHub Integration */}
          <GitHubIntegration />
          
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          {/* Supabase Integration */}
          <SupabaseIntegration />
        </Box>
      </Paper>
      <Box
        onClick={onToggle}
        sx={{
          position: 'absolute',
          left: -50,  // Fixed position regardless of sidebar state
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#000',
          color: '#fff',
          border: '1px solid #333',
          zIndex: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 10px',
          cursor: 'pointer',
          borderRadius: '4px',
          height: 'auto',
          width: 40,
          '&:hover': {
            background: '#000',  // Keep background color the same on hover
            color: '#fff'        // Keep text color the same on hover
          }
        }}
      >
        <Box sx={{ color: '#fff', mb: 2 }}>
          {open ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Box>
        <Box sx={{ 
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
          letterSpacing: '0.5px',
          mt: 1,
          mb: 1,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Configuration
        </Box>
      </Box>
    </Box>
  );
}

export default ServiceSidebar;
