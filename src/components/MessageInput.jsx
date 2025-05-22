import React from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  IconButton, 
  Typography 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

function MessageInput({ 
  selectedAgent, 
  userMessage, 
  setUserMessage, 
  isLoading, 
  handleSendMessage, 
  getSelectedAgentFile, 
  handleRemoveFile, 
  fileInputRef,
  leftOpen,
  rightOpen
}) {
  if (!selectedAgent) return null;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: leftOpen ? 385 : 0,
        right: rightOpen ? 305 : 0,
        p: 2,
        transition: 'left 0.2s, right 0.2s',
        bgcolor: 'transparent',
        zIndex: 10
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: '95%', 
        mx: 'auto',
        bgcolor: '#fff',
        p: 2,
        borderRadius: 1,
        boxShadow: '0 -1px 5px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Enter your query..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              disabled={isLoading}
              variant="outlined"
              sx={{ mr: 2 }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={isLoading || (!userMessage.trim() && !getSelectedAgentFile())}
                sx={{ 
                  minWidth: 'auto',
                  width: 56,
                  height: 56,
                  borderRadius: '50%'
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
              </Button>
            </Box>
          </Box>
          
          {getSelectedAgentFile() && (
            <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'rgba(0,0,0,0.05)', 
                borderRadius: 1 
              }}
            >
              <AttachFileIcon sx={{ fontSize: '0.9rem', mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                {getSelectedAgentFile().name}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleRemoveFile(selectedAgent.id)}
                sx={{ p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          )}
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 1, 
          ml: 0.5,
          color: 'text.secondary',
          fontSize: '0.75rem'
        }}>
          <WarningAmberIcon sx={{ color: 'warning.main', fontSize: '0.9rem', mr: 0.5 }} />
          Save your answers as the app does not store any content or activity history.
        </Box>
      </Box>
    </Box>
  );
}

export default MessageInput;
