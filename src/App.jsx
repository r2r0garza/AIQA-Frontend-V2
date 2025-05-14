import React, { useState, useRef } from 'react';
import axios from 'axios';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Box, 
  IconButton, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';

// List of available agents
const AGENTS = [
  { id: 'user-story-creator', name: 'User Story Creator', file: null },
  { id: 'acceptance-criteria-creator', name: 'Acceptance Criteria Creator', file: null },
  { id: 'test-cases-generator', name: 'Test Cases Generator', file: null },
  { id: 'automation-script-generator', name: 'Automation Script Generator', file: null },
  { id: 'test-data-generator', name: 'Test Data Generator', file: null },
  { id: 'language-detector', name: 'Language Detector', file: null }
];

function AgentSidebar({ open, onToggle, selectedAgent, onSelectAgent, onFileSelect, onFileRemove, agents }) {
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
        <Box sx={{ pt: 5, px: 2, pb: 2, display: open ? 'block' : 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 13 }}>
            <img src="/src/assets/logo.png" alt="Logo" style={{ height: '30px', marginRight: '8px' }} />
            <span style={{ color: 'red', margin: '0 8px', fontSize: '30px' }}>/</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center' }}>
              
              AI Quality Assistant
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {agents.map((agent) => (
              <ListItem key={agent.id} disablePadding sx={{ mb: 2 }}>
                <ListItemButton
                  selected={selectedAgent?.id === agent.id}
                  onClick={() => onSelectAgent(agent)}
                  sx={{
                    borderRadius: '4px',
                    bgcolor: 'transparent',
                    color: '#fff',
                    border: '1px solid #fff',
                    display: 'flex',
                    justifyContent: 'space-between',
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
                  }}
                >
                  <ListItemText primary={agent.name} />
                  {selectedAgent?.id === agent.id && (
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
          
          <Box sx={{ 
            mt: 4, 
            pt: 2, 
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.75rem'
          }}>
            <LocalOfferIcon sx={{ fontSize: '0.9rem', mr: 1 }} />
            Product Version: 0.0.1
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
    </Box>
  );
}

function RightSidebar({ open, onToggle }) {
  return (
    <Box sx={{ position: 'relative', height: '100vh', margin: 0, padding: 0 }}>
      <Paper
        elevation={3}
        sx={{
          width: open ? 260 : 0,
          minWidth: open ? 260 : 0,
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
        <Box sx={{ flex: 1, p: open ? 2 : 0, display: open ? 'block' : 'none' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>External Services</Typography>
          <Box mt={2}>[Integrations coming soon]</Box>
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

function App() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false); // Default to closed
  // Set Test Cases Generator as the default selected agent
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[2]); // Index 2 is Test Cases Generator
  const [aiResponse, setAiResponse] = useState(null);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Create a deep copy of AGENTS to track files
  const [agents, setAgents] = useState(JSON.parse(JSON.stringify(AGENTS)));
  const fileInputRef = useRef(null);
  const [currentAgentForFileUpload, setCurrentAgentForFileUpload] = useState(null);

  // Handle agent selection
  const handleSelectAgent = (agent) => {
    // If selecting a different agent, clear the AI response
    if (selectedAgent?.id !== agent.id) {
      setAiResponse(null);
    }
    setSelectedAgent(agent);
  };

  // Handle file selection for a specific agent
  const handleFileSelect = (agentId) => {
    setCurrentAgentForFileUpload(agentId);
    fileInputRef.current.click();
  };

  // Handle file change
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0] && currentAgentForFileUpload) {
      const newAgents = [...agents];
      const agentIndex = newAgents.findIndex(a => a.id === currentAgentForFileUpload);
      if (agentIndex !== -1) {
        newAgents[agentIndex].file = event.target.files[0];
        setAgents(newAgents);
      }
      setCurrentAgentForFileUpload(null);
    }
  };

  // Handle file removal for a specific agent
  const handleRemoveFile = (agentId) => {
    const newAgents = [...agents];
    const agentIndex = newAgents.findIndex(a => a.id === agentId);
    if (agentIndex !== -1) {
      newAgents[agentIndex].file = null;
      setAgents(newAgents);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get the currently selected agent's file
  const getSelectedAgentFile = () => {
    const agent = agents.find(a => a.id === selectedAgent?.id);
    return agent ? agent.file : null;
  };

  // Get webhook URL for the selected agent
  const getWebhookUrl = (agentId) => {
    const webhookMap = {
      'user-story-creator': import.meta.env.VITE_USER_STORY_CREATOR_WEBHOOK_URL,
      'acceptance-criteria-creator': import.meta.env.VITE_ACCEPTANCE_CRITERIA_CREATOR_WEBHOOK_URL,
      'test-cases-generator': import.meta.env.VITE_TEST_CASES_GENERATOR_WEBHOOK_URL,
      'automation-script-generator': import.meta.env.VITE_AUTOMATION_SCRIPT_GENERATOR_WEBHOOK_URL,
      'test-data-generator': import.meta.env.VITE_TEST_DATA_GENERATOR_WEBHOOK_URL,
      'language-detector': import.meta.env.VITE_LANGUAGE_DETECTOR_WEBHOOK_URL
    };
    
    return webhookMap[agentId];
  };

  // Handle sending message
  const handleSendMessage = async () => {
    const agentFile = getSelectedAgentFile();
    if (!userMessage.trim() && !agentFile) return;
    
    setIsLoading(true);
    setAiResponse(null);
    
    try {
      const webhookUrl = getWebhookUrl(selectedAgent.id);
      
      if (!webhookUrl) {
        console.error(`No webhook URL found for agent: ${selectedAgent.id}`);
        setAiResponse(`Error: No webhook URL configured for ${selectedAgent.name}`);
        setIsLoading(false);
        return;
      }
      
      // Create FormData object for the request
      const formData = new FormData();
      formData.append('message', userMessage);
      
      if (agentFile) {
        formData.append('file', agentFile);
      }
      
      formData.append('agent', selectedAgent.id);
      
      // Send the request to the webhook
      const response = await axios.post(webhookUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Handle the response
      console.log('Server response:', response.data);
      
      // Check for different possible response structures
      if (response.data && response.data.response) {
        // Standard format: { response: "..." }
        setAiResponse(response.data.response);
      } else if (response.data && typeof response.data === 'string') {
        // Direct string response
        setAiResponse(response.data);
      } else if (response.data && response.data.text) {
        // Alternative format: { text: "..." }
        setAiResponse(response.data.text);
      } else if (response.data && response.data.content) {
        // Alternative format: { content: "..." }
        setAiResponse(response.data.content);
      } else if (response.data && response.data.message) {
        // Alternative format: { message: "..." }
        setAiResponse(response.data.message);
      } else if (response.data && response.data.result) {
        // Alternative format: { result: "..." }
        setAiResponse(response.data.result);
      } else if (response.data) {
        // If response.data exists but none of the above properties are found,
        // try to stringify the entire response data
        try {
          const stringifiedData = JSON.stringify(response.data, null, 2);
          setAiResponse(`\`\`\`json\n${stringifiedData}\n\`\`\``);
        } catch (e) {
          setAiResponse("Received response from server, but couldn't parse the content.");
        }
      } else {
        setAiResponse("Received response from server, but no content was provided.");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setAiResponse(`Error: ${error.response.status} - ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setAiResponse("Error: No response received from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setAiResponse(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      // Don't clear the message or file so users can refine their prompts
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: '#fafbfc', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <AgentSidebar 
        open={leftOpen} 
        onToggle={() => setLeftOpen((v) => !v)} 
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        onFileSelect={handleFileSelect}
        onFileRemove={handleRemoveFile}
        agents={agents}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', bgcolor: '#fff' }}>
          {selectedAgent ? (
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 2,
              height: 'calc(100vh - 120px)', // Adjust height to account for input area
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box 
                sx={{ 
                  width: '100%', 
                  maxWidth: '95%', 
                  mx: 'auto', 
                  mb: 4,
                  p: 2,
                  flex: 1
                }}
              >
                {aiResponse && (
                  <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    bgcolor: '#f5f5f5', 
                    borderRadius: 1, 
                    overflow: 'auto',
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    maxHeight: 'calc(100vh - 200px)', // Ensure box doesn't exceed viewport
                  }}>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeRaw]}
                    >
                      {aiResponse}
                    </ReactMarkdown>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Paper sx={{ p: 4, minWidth: 320, minHeight: 200, textAlign: 'center' }}>
                <Typography variant="h5">AI Quality Assistant</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Please select an agent from the sidebar to get started.
                </Typography>
              </Paper>
            </Box>
          )}
          
          {/* Input area - fixed to bottom */}
          {selectedAgent && (
            <Box 
              sx={{ 
                position: 'fixed', 
                bottom: 0, 
                left: leftOpen ? 385 : 0,
                right: rightOpen ? 260 : 0,
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
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
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
          )}
        </Box>
      </Box>
      <RightSidebar open={rightOpen} onToggle={() => setRightOpen((v) => !v)} />
    </Box>
  );
}

export default App;
