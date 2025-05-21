import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Checkbox,
  Tooltip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SyntheticDataModal from './integrations/SyntheticDataModal';
import logo from '/src/assets/logo.png';
import techBG from '/src/assets/tech-bg.png';

// Image dimming percentage - adjust this value to control the image brightness
// 0% = no dimming (full brightness), 100% = completely dark
const IMAGE_DIM_PERCENTAGE = 30; // Currently set to 10% dimming

function AgentSidebar({ 
  open, 
  onToggle, 
  selectedAgent, 
  onSelectAgent, 
  onFileSelect, 
  onFileRemove, 
  agents,
  chainModeEnabled,
  onChainModeToggle,
  selectedAgentsForChain,
  onAgentChainSelectionToggle,
  onChainFileSelect,
  chainFile,
  onChainFileRemove,
  onStartChain,
  isChainRunning
}) {
  // Synthetic Data Generator config from .env
  const SYNTHETIC_DATA_GUI = import.meta.env.VITE_SYNTHETIC_DATA_GUI === 'true';
  const SYNTHETIC_DATA_URL = import.meta.env.VITE_SYNTHETIC_DATA_URL || '';
  
  // State for synthetic data modal
  const [syntheticModalOpen, setSyntheticModalOpen] = useState(false);
  
  // Handle Synthetic Data agent selection
  useEffect(() => {
    if (selectedAgent?.id === 'synthetic-data-generator') {
      if (SYNTHETIC_DATA_GUI) {
        if (SYNTHETIC_DATA_URL) {
          window.open(SYNTHETIC_DATA_URL, '_blank');
          
          // Find the Test Cases Generator agent and select it
          const testCasesAgent = agents.find(agent => agent.id === 'test-cases-generator');
          if (testCasesAgent) {
            onSelectAgent(testCasesAgent);
          }
        }
      } else {
        setSyntheticModalOpen(true);
        
        // Find the Test Cases Generator agent and select it
        const testCasesAgent = agents.find(agent => agent.id === 'test-cases-generator');
        if (testCasesAgent) {
          onSelectAgent(testCasesAgent);
        }
      }
    }
  }, [selectedAgent, SYNTHETIC_DATA_GUI, SYNTHETIC_DATA_URL, agents, onSelectAgent]);
  
  // Calculate the opacity based on the dimming percentage
  // 0% dimming = 1.0 opacity, 100% dimming = 0.0 opacity
  const imageOpacity = 1 - (IMAGE_DIM_PERCENTAGE / 100);
  
  return (
    <Box sx={{ position: 'relative', height: '100vh', margin: 0, padding: 0 }}>
      <Paper
        elevation={3}
        sx={{
          width: open ? 385 : 0,
          minWidth: open ? 385 : 0,
          transition: 'width 0.2s',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRight: open ? '1px solid #333' : 'none',
          height: '100%',
          bgcolor: '#000',
          color: '#fff',
          borderRadius: 0,
          margin: 0,
          padding: 0
        }}
      >
        <Box sx={{ 
          pt: 5, 
          px: 2, 
          pb: 2, 
          display: open ? 'flex' : 'none', 
          flexDirection: 'column',
          height: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <img src={logo} alt="Logo" style={{ height: '30px', marginRight: '8px' }} />
            <span style={{ color: 'red', margin: '0 8px', fontSize: '30px' }}>/</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center' }}>
              AI Quality Assistant
            </Typography>
          </Box>
          
          {/* Chain Mode Toggle and Controls */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={chainModeEnabled}
                    onChange={onChainModeToggle}
                    disabled={isChainRunning}
                  />
                }
                label="Chain Mode"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    color: '#fff',
                    fontSize: '0.9rem'
                  }
                }}
              />
              
              <Tooltip title={chainFile ? "Change file and run" : "Select file and run"}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!chainModeEnabled || isChainRunning || selectedAgentsForChain.length < 2}
                  onClick={onChainFileSelect}
                  startIcon={chainFile ? <PlayArrowIcon /> : <UploadFileIcon />}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: '#fff',
                    '&:hover': {
                      borderColor: '#fff',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {chainFile ? "Run" : "Select & Run"}
                </Button>
              </Tooltip>
            </Box>
            
            {chainFile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                bgcolor: 'rgba(255,255,255,0.1)', 
                borderRadius: 1,
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.8)'
              }}>
                <AttachFileIcon sx={{ fontSize: '0.9rem', mr: 1 }} />
                <Typography variant="body2" sx={{ 
                  flex: 1, 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  {chainFile.name}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={onChainFileRemove}
                  disabled={isChainRunning}
                  sx={{ 
                    p: 0.5, 
                    color: 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      color: '#fff'
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Box>
            )}
          </Box>
          
          <List sx={{ p: 0, flex: 1 }}>
            {agents.filter(agent => !agent.hidden).map((agent) => (
              <ListItem key={agent.id} disablePadding sx={{ mb: 2 }}>
                {chainModeEnabled && (
                  <Checkbox
                    checked={selectedAgentsForChain.includes(agent.id)}
                    onChange={() => onAgentChainSelectionToggle(agent.id)}
                    disabled={isChainRunning || agent.id === 'test-data-generator' || agent.id === 'synthetic-data-generator'}
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&.Mui-checked': {
                        color: '#fff',
                      },
                      '&.Mui-disabled': {
                        color: 'rgba(255,255,255,0.2)',
                      },
                      padding: '4px',
                      marginRight: '4px'
                    }}
                  />
                )}
                <ListItemButton
                  selected={selectedAgent?.id === agent.id}
                  onClick={() => onSelectAgent(agent)}
                  disabled={chainModeEnabled}
                  sx={{
                    borderRadius: '4px',
                    bgcolor: 'transparent',
                    color: '#fff',
                    border: '1px solid #fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flex: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.3)',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      color: 'rgba(255,255,255,0.5)',
                      borderColor: 'rgba(255,255,255,0.5)',
                    }
                  }}
                >
                  <ListItemText primary={agent.name} />
                  {selectedAgent?.id === agent.id && agent.id !== 'synthetic-data-generator' && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        agent.file ? onFileRemove(agent.id) : onFileSelect(agent.id);
                      }}
                      sx={{ p: 0.5, color: '#fff' }}
                    >
                      {agent.file ? <CloseIcon sx={{ fontSize: '0.9rem' }} /> : <AttachFileIcon sx={{ fontSize: '1rem' }} />}
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          
          {/* Footer section with version and background image */}
          <Box sx={{ mt: 'auto' }}>
            {/* Version info */}
            <Box sx={{ 
              pt: 2, 
              borderTop: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              mb: 2
            }}>
              <LocalOfferIcon sx={{ fontSize: '0.9rem', mr: 1 }} />
              Product Version: 0.0.1
            </Box>
            
            {/* Tech background image with gradient fade */}
            <Box sx={{ 
              height: 250, 
              width: '100%', 
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${techBG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: imageOpacity, // Apply the calculated opacity based on dimming percentage
                maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 1) 40%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 1) 40%)'
              }} />
            </Box>
          </Box>
        </Box>
      </Paper>
      <IconButton
        size="small"
        onClick={onToggle}
        disableRipple
        sx={{
          position: 'absolute',
          right: open ? -18 : -30,  // Move further right when closed
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#000',
          color: '#fff',
          border: '1px solid #333',
          zIndex: 1,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',  // Add shadow for better visibility
          '&:hover': {
            background: '#000',  // Keep background color the same on hover
            color: '#fff'        // Keep text color the same on hover
          }
        }}
      >
        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>
      
      {/* Synthetic Data Generator Modal */}
      <SyntheticDataModal 
        open={syntheticModalOpen} 
        onClose={() => setSyntheticModalOpen(false)} 
      />
    </Box>
  );
}

export default AgentSidebar;
