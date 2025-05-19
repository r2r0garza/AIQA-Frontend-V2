import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Tooltip, 
  Snackbar, 
  Alert,
  Button,
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import { AGENTS } from '../constants';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function ResponseDisplay({ 
  selectedAgent, 
  aiResponse, 
  rightOpen,
  chainResults,
  isChainRunning,
  currentChainStep,
  selectedAgentsForChain,
  chainModeEnabled,
  onDownloadResult
}) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('Response copied to clipboard!');
  const [selectionPosition, setSelectionPosition] = useState(null);
  const responseBoxRef = useRef(null);
  const markdownRef = useRef(null);
  
  // Handle copying the entire response as formatted HTML
  const handleCopyFormatted = () => {
    if (markdownRef.current && aiResponse) {
      // Create a temporary element to hold the HTML content
      const tempDiv = document.createElement('div');
      
      // Clone the rendered markdown content
      tempDiv.appendChild(markdownRef.current.cloneNode(true));
      
      // Apply some basic styling to maintain formatting
      const style = document.createElement('style');
      style.textContent = `
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        code { font-family: monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
      `;
      tempDiv.appendChild(style);
      
      try {
        // Use the Clipboard API to write HTML content
        const blob = new Blob([tempDiv.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        
        navigator.clipboard.write([clipboardItem])
          .then(() => {
            setCopyMessage('Formatted content copied to clipboard!');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
          })
          .catch(err => {
            console.error('Failed to copy formatted content: ', err);
            // Fall back to copying the HTML as text
            navigator.clipboard.writeText(tempDiv.innerHTML);
            setCopyMessage('HTML copied to clipboard (as text)!');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
          });
      } catch (err) {
        console.error('ClipboardItem API not supported, falling back to text copy', err);
        // Fall back to copying the inner HTML as text
        navigator.clipboard.writeText(tempDiv.innerHTML);
        setCopyMessage('HTML copied to clipboard (as text)!');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      }
    }
  };
  
  // Handle copying selected text
  const handleCopySelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      navigator.clipboard.writeText(selection.toString())
        .then(() => {
          setCopyMessage('Selection copied to clipboard!');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
          // Clear selection after copying
          selection.removeAllRanges();
          setSelectionPosition(null);
        })
        .catch(err => {
          console.error('Failed to copy selection: ', err);
        });
    }
  };
  
  // Track text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString() && 
          responseBoxRef.current && 
          responseBoxRef.current.contains(selection.anchorNode)) {
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const boxRect = responseBoxRef.current.getBoundingClientRect();
        
        // Calculate position relative to the response box
        setSelectionPosition({
          top: rect.top - boxRect.top,
          left: rect.right - boxRect.left
        });
      } else {
        setSelectionPosition(null);
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  if (!selectedAgent && !chainModeEnabled) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, minWidth: 320, minHeight: 200, textAlign: 'center' }}>
          <Typography variant="h5">AI Quality Assistant</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Please select an agent from the sidebar to get started.
          </Typography>
        </Paper>
      </Box>
    );
  }
  
  // Render chain progress and results
  const renderChainContent = () => {
    if (!chainModeEnabled) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        {isChainRunning && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Chain Process Running</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                Step {currentChainStep + 1} of {selectedAgentsForChain.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                {selectedAgentsForChain.map((agentId, index) => {
                  const agent = AGENTS.find(a => a.id === agentId);
                  return (
                    <span key={agentId}>
                      {index > 0 && " → "}
                      <span style={{ 
                        fontWeight: index === currentChainStep ? 'bold' : 'normal',
                        color: index === currentChainStep ? '#1976d2' : 'inherit'
                      }}>
                        {agent?.name || agentId}
                      </span>
                    </span>
                  );
                })}
              </Typography>
            </Box>
            <LinearProgress />
          </Box>
        )}
        
        {chainResults.length > 0 && !isChainRunning && (
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: '#f9f9f9', 
            border: '1px solid #eee', 
            borderRadius: 1,
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Chain Results</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {chainResults.map((result, index) => {
                const agent = AGENTS.find(a => a.id === result.agentId);
                const isExcelFormat = result.agentId === 'test-cases-generator' || result.agentId === 'test-data-generator';
                
                return (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      p: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      minWidth: '250px',
                      flexGrow: 1
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Step {index + 1}: {agent?.name || result.agentId}
                      </Typography>
                    </Box>
                    <Tooltip title={`Download as ${isExcelFormat ? 'Excel' : 'Word'} document`}>
                      <IconButton
                        size="small"
                        onClick={() => onDownloadResult(result.response, result.agentId, index)}
                        color="primary"
                      >
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

/**
 * Preprocesses DOCX-like markdown to proper markdown for better rendering.
 */
function formatDocxMarkdown(text) {
  if (!text) return '';

  // If the text already starts with markdown headings, don't reformat
  if (/^\s*#/.test(text)) {
    return text.trim();
  }

  // Convert "US-001: Title" and similar to H2
  text = text.replace(/^([A-Z]+-\d+:\s.*)$/gm, '## $1');

  // Convert lines of === or --- to H1/H2
  text = text.replace(/^[=]{3,}\s*$/gm, ''); // Remove lines of only ===
  text = text.replace(/^-{3,}\s*$/gm, '');   // Remove lines of only ---

  // Convert section headers to H3
  const sectionHeaders = [
    'User Story:',
    'Acceptance Criteria:',
    'Non-Functional Requirements:',
    'Notes:',
    'Warnings:',
    'Suggestions for improvement:'
  ];
  sectionHeaders.forEach(header => {
    text = text.replace(new RegExp(`^${header}`, 'gm'), `### ${header.replace(':','')}`);
  });

  // Numbered lists: ensure they start with "1." etc.
  text = text.replace(/^(\d+)\.\s+/gm, (m, n) => `${n}. `);

  // Indented sub-items: convert to markdown sub-lists
  text = text.replace(/^ {2,}- /gm, '  - ');

  // Remove excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Clean up trailing whitespace
  text = text.replace(/[ \t]+$/gm, '');

  return text.trim();
}

  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto', 
      p: 2,
      height: 'calc(100vh - 120px)', // Adjust height to account for input area
      display: 'flex',
      flexDirection: 'column',
      position: 'relative', // Add position relative to the container
      pb: 10 // Add extra padding at the bottom to prevent content from being obscured by the message input
    }}>
      {/* Chain mode content */}
      {renderChainContent()}
      {/* Fixed copy button outside the response box */}
      {aiResponse && (
        <Tooltip title="Copy formatted response">
          <IconButton 
            onClick={handleCopyFormatted}
            sx={{ 
              position: 'fixed', 
              top: 20, 
              right: rightOpen ? 280 : 20, // Adjust based on right sidebar
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              zIndex: 100,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,1)',
              }
            }}
            size="medium"
          >
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      )}
      
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
          <Box 
            ref={responseBoxRef}
            sx={{ 
              mb: 4, 
              p: 3, 
              bgcolor: '#f5f5f5', 
              borderRadius: 1, 
              overflow: 'auto',
              fontSize: '1rem',
              lineHeight: 1.6,
              maxHeight: 'calc(100vh - 200px)', // Ensure box doesn't exceed viewport
              position: 'relative'
            }}
          >
            {/* Selection copy button */}
            {selectionPosition && (
              <Tooltip title="Copy selection">
                <IconButton 
                  onClick={handleCopySelection}
                  sx={{ 
                    position: 'absolute', 
                    top: selectionPosition.top + 20, // Position below the selection
                    left: selectionPosition.left,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,1)',
                    },
                    zIndex: 10
                  }}
                  size="small"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <div ref={markdownRef}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                rehypePlugins={[rehypeRaw]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : 'text';
                    
                    return !inline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {formatDocxMarkdown(aiResponse)}
              </ReactMarkdown>
            </div>
          </Box>
        )}
      </Box>
      <Snackbar 
        open={copySuccess} 
        autoHideDuration={3000} 
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {copyMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ResponseDisplay;
