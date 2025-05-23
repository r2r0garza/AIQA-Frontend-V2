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
  Chip,
  Switch,
  FormControlLabel
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
  const [splitCodeBlocks, setSplitCodeBlocks] = useState(false);
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
  
  // Handle copying individual file content
  const handleCopyFileContent = (content, filename) => {
    try {
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopyMessage(`${filename} copied to clipboard!`);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy file content: ', err);
        });
    } catch (err) {
      console.error('Clipboard API not supported: ', err);
    }
  };
  
  // Handle copying selected text with formatting
  const handleCopySelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      try {
        // Create a temporary element to hold the selected HTML content
        const tempDiv = document.createElement('div');
        
        // Get the range and clone its contents with formatting
        const range = selection.getRangeAt(0);
        const fragment = range.cloneContents();
        tempDiv.appendChild(fragment);
        
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
        
        // Try to copy as HTML first
        const blob = new Blob([tempDiv.innerHTML], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        
        navigator.clipboard.write([clipboardItem])
          .then(() => {
            setCopyMessage('Formatted selection copied to clipboard!');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 3000);
            // Clear selection after copying
            selection.removeAllRanges();
            setSelectionPosition(null);
          })
          .catch(err => {
            console.error('Failed to copy formatted selection: ', err);
            // Fall back to copying as plain text
            navigator.clipboard.writeText(selection.toString())
              .then(() => {
                setCopyMessage('Selection copied to clipboard (as text)!');
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 3000);
                // Clear selection after copying
                selection.removeAllRanges();
                setSelectionPosition(null);
              });
          });
      } catch (err) {
        console.error('ClipboardItem API not supported, falling back to text copy', err);
        // Fall back to copying as plain text
        navigator.clipboard.writeText(selection.toString())
          .then(() => {
            setCopyMessage('Selection copied to clipboard (as text)!');
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
    }
  };
  
  // Track text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      // Don't show copy bubble for Automation Script Generator code blocks
      if (selectedAgent?.id === 'automation-script-generator') {
        // Check if selection is within a code block
        let node = selection.anchorNode;
        let isInCodeBlock = false;
        
        // Traverse up the DOM tree to check if we're in a code block
        while (node && node !== document.body) {
          if (node.tagName === 'PRE' || 
              node.tagName === 'CODE' || 
              node.className?.includes('syntaxhighlighter')) {
            isInCodeBlock = true;
            break;
          }
          node = node.parentNode;
        }
        
        // If in code block for automation script generator, don't show copy bubble
        if (isInCodeBlock) {
          setSelectionPosition(null);
          return;
        }
      }
      
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
  }, [selectedAgent]);

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

/**
 * Splits code blocks at file boundaries for Automation Script Generator
 * @param {string} text - The code content to split
 * @returns {Array} - Array of objects with filename and content
 */
function splitCodeByFiles(text) {
  if (!text) return [];
  
  // Regular expression to match file paths in comments
  // This pattern looks for lines like "// filename.ext" or "/* filename.ext */"
  const filePathPattern = /^\s*(?:\/\/|\/\*)\s*([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?:\s*\*\/)?/;
  
  const lines = text.split('\n');
  const files = [];
  let currentFile = null;
  let currentContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(filePathPattern);
    
    if (match) {
      // If we already have a file, save it before starting a new one
      if (currentFile) {
        files.push({
          filename: currentFile,
          content: currentContent.join('\n')
        });
      }
      
      // Start a new file
      currentFile = match[1];
      currentContent = [line]; // Include the file path comment
    } else if (currentFile) {
      // Add line to current file
      currentContent.push(line);
    } else {
      // If no file has been identified yet, start with an "unknown" file
      currentFile = "code";
      currentContent = [line];
    }
  }
  
  // Add the last file
  if (currentFile) {
    files.push({
      filename: currentFile,
      content: currentContent.join('\n')
    });
  }
  
  return files;
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
      {/* Fixed buttons outside the response box */}
      {aiResponse && (
        <>
          {/* Global copy button - only show when not in split mode for Automation Script Generator */}
          {!(selectedAgent?.id === 'automation-script-generator' && splitCodeBlocks) && (
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
          
          {/* Toggle switch for splitting code blocks (only for Automation Script Generator) */}
          {selectedAgent?.id === 'automation-script-generator' && (
            <Box 
              sx={{ 
                position: 'fixed', 
                top: 20, 
                right: rightOpen ? 340 : 80, // Position to the left of the copy button
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                borderRadius: 1,
                padding: '2px 8px',
                zIndex: 100
              }}
            >
              <FormControlLabel
                control={
                  <Switch 
                    checked={splitCodeBlocks}
                    onChange={(e) => setSplitCodeBlocks(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="caption">
                    Split Files
                  </Typography>
                }
                sx={{ margin: 0 }}
              />
            </Box>
          )}
        </>
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
              {/* For Automation Script Generator with split code blocks enabled */}
              {selectedAgent?.id === 'automation-script-generator' && splitCodeBlocks ? (
                // Extract code blocks from the response and render them separately
                (() => {
                  // Find the code block in the response
                  const codeBlockMatch = aiResponse.match(/```(?:[\w-]+)?\n([\s\S]+?)```/);
                  
                  if (codeBlockMatch) {
                    const codeContent = codeBlockMatch[1];
                    const files = splitCodeByFiles(codeContent);
                    
                    // Get the text before and after the code block
                    const beforeCode = aiResponse.substring(0, codeBlockMatch.index);
                    const afterCode = aiResponse.substring(codeBlockMatch.index + codeBlockMatch[0].length);
                    
                    return (
                      <>
                        {/* Render text before code block */}
                        {beforeCode && (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                          >
                            {formatDocxMarkdown(beforeCode)}
                          </ReactMarkdown>
                        )}
                        
                        {/* Render each file as a separate code block */}
                        {files.map((file, index) => (
                          <Box key={index} sx={{ mb: 3 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              mb: 1
                            }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontFamily: 'monospace',
                                  color: '#0277bd',
                                  fontWeight: 'bold'
                                }}
                              >
                                {file.filename}
                              </Typography>
                              <Tooltip title={`Copy ${file.filename}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyFileContent(file.content, file.filename)}
                                  sx={{ 
                                    color: '#0277bd',
                                    '&:hover': {
                                      bgcolor: 'rgba(2, 119, 189, 0.1)',
                                    }
                                  }}
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language="text"
                              PreTag="div"
                            >
                              {file.content}
                            </SyntaxHighlighter>
                          </Box>
                        ))}
                        
                        {/* Render text after code block */}
                        {afterCode && (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            rehypePlugins={[rehypeRaw]}
                          >
                            {formatDocxMarkdown(afterCode)}
                          </ReactMarkdown>
                        )}
                      </>
                    );
                  }
                  
                  // If no code block found, render normally
                  return (
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
                  );
                })()
              ) : (
                // Default rendering for all other agents or when split is disabled
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
              )}
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
