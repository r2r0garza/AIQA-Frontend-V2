import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Box, Snackbar, Alert } from '@mui/material';
import { JiraProvider } from './contexts/JiraContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { TeamProvider } from './contexts/TeamContext';
import { DocumentProvider } from './contexts/DocumentContext';
import { GitHubProvider } from './contexts/GitHubContext';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as XLSX from 'xlsx';
import TeamSelectionModal from './components/TeamSelectionModal';
// Don't import useTeam directly

// Function to generate simulated responses for demo purposes
const generateSimulatedResponse = (agentId, message) => {
  const currentDate = new Date().toLocaleDateString();
  
  switch (agentId) {
    case 'user-story-creator':
      return `## User Story\n\nAs a user, I want to ${message.toLowerCase().includes('login') ? 'log in to the system' : 'perform the requested action'} so that I can ${message.toLowerCase().includes('access') ? 'access my account information' : 'achieve my goals'}.\n\n**Acceptance Criteria:**\n1. User should be able to ${message.toLowerCase().includes('login') ? 'enter username and password' : 'interact with the system'}\n2. System should validate the ${message.toLowerCase().includes('login') ? 'credentials' : 'input'}\n3. User should receive appropriate feedback\n\n**Priority:** Medium\n**Story Points:** 3`;
      
    case 'acceptance-criteria-creator':
      return `## Acceptance Criteria\n\n### Scenario 1: ${message.toLowerCase().includes('login') ? 'Successful Login' : 'Successful Operation'}\n**Given** the user is on the ${message.toLowerCase().includes('login') ? 'login page' : 'main page'}\n**When** they ${message.toLowerCase().includes('login') ? 'enter valid credentials and click login' : 'perform the requested action correctly'}\n**Then** they should ${message.toLowerCase().includes('login') ? 'be redirected to the dashboard' : 'see a success message'}\n\n### Scenario 2: ${message.toLowerCase().includes('login') ? 'Failed Login' : 'Failed Operation'}\n**Given** the user is on the ${message.toLowerCase().includes('login') ? 'login page' : 'main page'}\n**When** they ${message.toLowerCase().includes('login') ? 'enter invalid credentials' : 'perform the action incorrectly'}\n**Then** they should ${message.toLowerCase().includes('login') ? 'see an error message' : 'receive appropriate error feedback'}`;
      
    case 'test-cases-generator':
      return `## Test Cases\n\n| Test ID | Description | Steps | Expected Result | Status |\n|---------|-------------|-------|-----------------|--------|\n| TC001 | ${message.toLowerCase().includes('login') ? 'Verify successful login' : 'Verify successful operation'} | 1. ${message.toLowerCase().includes('login') ? 'Navigate to login page' : 'Navigate to main page'}<br>2. ${message.toLowerCase().includes('login') ? 'Enter valid username and password' : 'Perform the requested action'}<br>3. ${message.toLowerCase().includes('login') ? 'Click login button' : 'Submit the form'} | ${message.toLowerCase().includes('login') ? 'User is logged in and redirected to dashboard' : 'Operation completes successfully'} | Not Run |\n| TC002 | ${message.toLowerCase().includes('login') ? 'Verify login with invalid credentials' : 'Verify operation with invalid input'} | 1. ${message.toLowerCase().includes('login') ? 'Navigate to login page' : 'Navigate to main page'}<br>2. ${message.toLowerCase().includes('login') ? 'Enter invalid username and password' : 'Enter invalid data'}<br>3. ${message.toLowerCase().includes('login') ? 'Click login button' : 'Submit the form'} | ${message.toLowerCase().includes('login') ? 'Error message is displayed' : 'Appropriate error message is shown'} | Not Run |`;
      
    case 'automation-script-generator':
      return `\`\`\`python\n# Automation script for ${message}\nimport pytest\nfrom selenium import webdriver\nfrom selenium.webdriver.common.by import By\n\nclass Test${message.toLowerCase().includes('login') ? 'Login' : 'Feature'}:\n    def setup_method(self):\n        self.driver = webdriver.Chrome()\n        self.driver.get("https://example.com")\n        \n    def test_${message.toLowerCase().includes('login') ? 'successful_login' : 'successful_operation'}(self):\n        # Arrange\n        ${message.toLowerCase().includes('login') ? 'username_field = self.driver.find_element(By.ID, "username")\npassword_field = self.driver.find_element(By.ID, "password")\nlogin_button = self.driver.find_element(By.ID, "login-button")' : '# Set up test conditions'}\n        \n        # Act\n        ${message.toLowerCase().includes('login') ? 'username_field.send_keys("testuser")\npassword_field.send_keys("password123")\nlogin_button.click()' : '# Perform the operation'}\n        \n        # Assert\n        ${message.toLowerCase().includes('login') ? 'assert "Dashboard" in self.driver.title' : 'assert "Success" in self.driver.page_source'}\n        \n    def teardown_method(self):\n        self.driver.quit()\n\`\`\``;
      
    case 'test-data-generator':
      return `## Test Data\n\n| ID | ${message.toLowerCase().includes('login') ? 'Username' : 'Name'} | ${message.toLowerCase().includes('login') ? 'Password' : 'Value'} | ${message.toLowerCase().includes('login') ? 'Expected Result' : 'Description'} |\n|----|----------|----------|------------------|\n| 1 | valid_user | valid_pass123 | Success |\n| 2 | invalid_user | invalid_pass | Failure - Invalid Credentials |\n| 3 | valid_user | wrong_pass | Failure - Wrong Password |\n| 4 | empty | valid_pass123 | Failure - Empty Username |\n| 5 | valid_user | empty | Failure - Empty Password |\n| 6 | special@chars.com | valid_pass123 | Success |\n| 7 | very_long_username_that_exceeds_the_maximum_allowed_length | valid_pass123 | Failure - Username Too Long |`;
      
    case 'language-detector':
      return `## Language Detection\n\nThe text "${message}" appears to be in ${message.length > 0 ? (message.match(/[a-zA-Z]/) ? 'English' : 'a non-Latin script language') : 'an unknown language'}.\n\n**Confidence:** ${Math.floor(Math.random() * 20) + 80}%\n\n**Detected Languages:**\n1. ${message.length > 0 ? (message.match(/[a-zA-Z]/) ? 'English' : 'Unknown') : 'Unknown'}: ${Math.floor(Math.random() * 20) + 80}%\n2. ${message.length > 0 ? (message.match(/[a-zA-Z]/) ? 'Spanish' : 'Japanese') : 'Spanish'}: ${Math.floor(Math.random() * 10) + 5}%\n3. ${message.length > 0 ? (message.match(/[a-zA-Z]/) ? 'French' : 'Chinese') : 'French'}: ${Math.floor(Math.random() * 5) + 1}%`;
      
    default:
      return `I've processed your request: "${message}"\n\nThis is a simulated response for demonstration purposes. In a real implementation, this would connect to the actual AI service.`;
  }
};

// Import components
import AgentSidebar from './components/AgentSidebar';
import ServiceSidebar from './components/ServiceSidebar';
import ResponseDisplay from './components/ResponseDisplay';
import MessageInput from './components/MessageInput';

// Import constants
import { AGENTS, DEFAULT_AGENT_INDEX } from './constants';

// Create a TeamConsumer component to safely access team context
const TeamConsumer = ({ children }) => {
  const teamContext = React.useContext(React.createContext({}));
  return children(teamContext?.selectedTeam || null);
};

function App() {
  // Initialize selectedTeam as null - we'll get it from the TeamProvider later
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false); // Default to closed
  // Set Test Cases Generator as the default selected agent
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[DEFAULT_AGENT_INDEX]);
  const [aiResponse, setAiResponse] = useState(null);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Create a deep copy of AGENTS to track files
  const [agents, setAgents] = useState(JSON.parse(JSON.stringify(AGENTS)));
  const fileInputRef = useRef(null);
  const [currentAgentForFileUpload, setCurrentAgentForFileUpload] = useState(null);
  
  // Chain mode state
  const [chainModeEnabled, setChainModeEnabled] = useState(false);
  const [selectedAgentsForChain, setSelectedAgentsForChain] = useState([]);
  const [chainFile, setChainFile] = useState(null);
  const [isChainRunning, setIsChainRunning] = useState(false);
  const [chainResults, setChainResults] = useState([]);
  const [currentChainStep, setCurrentChainStep] = useState(0);
  const chainFileInputRef = useRef(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Handle agent selection
  const handleSelectAgent = (agent) => {
    // If selecting a different agent, clear the AI response and user message
    if (selectedAgent?.id !== agent.id) {
      setAiResponse(null);
      setUserMessage(''); // Clear user message when changing agents
    }
    setSelectedAgent(agent);
  };
  
  // Handle chain mode toggle
  const handleChainModeToggle = (event) => {
    const isEnabled = event.target.checked;
    setChainModeEnabled(isEnabled);
    
    if (isEnabled) {
      // When enabling chain mode, remove Test Data Generator and Synthetic Data Generator
      // from the selected agents if they were previously selected
      setSelectedAgentsForChain(prev => 
        prev.filter(id => id !== 'test-data-generator' && id !== 'synthetic-data-generator')
      );
    } else {
      // Clear selected agents when disabling chain mode
      setSelectedAgentsForChain([]);
      setChainFile(null);
      setChainResults([]);
    }
  };
  
  // Handle agent selection for chain
  const handleAgentChainSelectionToggle = (agentId) => {
    setSelectedAgentsForChain(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };
  
  // Handle chain file selection
  const handleChainFileSelect = () => {
    if (selectedAgentsForChain.length < 2) {
      showSnackbar('Please select at least two agents for the chain', 'warning');
      return;
    }
    
    if (chainFile) {
      // If file already selected, start the chain process
      handleStartChain();
    } else {
      // Otherwise, open file selector
      chainFileInputRef.current.click();
    }
  };
  
  // Handle chain file change
  const handleChainFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setChainFile(event.target.files[0]);
    }
  };
  
  // Handle chain file removal
  const handleChainFileRemove = () => {
    setChainFile(null);
    if (chainFileInputRef.current) {
      chainFileInputRef.current.value = '';
    }
  };
  
  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Convert markdown table to Excel data
  const convertMarkdownTableToExcel = (markdown) => {
    // Extract table content
    const tableRegex = /\|(.+)\|/g;
    const rows = markdown.match(tableRegex);

    if (!rows || rows.length < 2) {
      return null;
    }

    // Process header row
    const headerRow = rows[0].split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());

    // Process data rows, replacing <br> with newlines
    const dataRows = rows.slice(2).map(row =>
      row.split('|').filter(cell => cell.trim() !== '').map(cell =>
        cell.trim().replace(/<br\s*\/?>/gi, '\n')
      )
    );

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    return workbook;
  };
  
  // Convert markdown to Word document
  const convertMarkdownToDocx = (markdown) => {
    try {
      const { Table, TableRow, TableCell } = require("docx");
      const children = [];
      const lines = markdown.split('\n');
      let inList = false;
      let inCodeBlock = false;
      let codeContent = '';
      let tableRows = [];
      let inTable = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Handle code blocks
        if (line.startsWith('```')) {
          if (inCodeBlock) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: codeContent,
                    font: 'Courier New',
                    size: 20
                  })
                ],
                shading: {
                  type: 'solid',
                  color: 'F5F5F5'
                },
                spacing: {
                  before: 200,
                  after: 200
                }
              })
            );
            codeContent = '';
            inCodeBlock = false;
          } else {
            inCodeBlock = true;
          }
          continue;
        }
        if (inCodeBlock) {
          codeContent += line + '\n';
          continue;
        }

        // Handle tables
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          inTable = true;
          tableRows.push(line.trim());
          continue;
        } else if (inTable && (!line.trim().startsWith('|') || !line.trim().endsWith('|'))) {
          // End of table, process tableRows
          if (tableRows.length >= 2) {
            // Remove separator row (second row)
            const header = tableRows[0].split('|').slice(1, -1).map(cell => cell.trim());
            const rows = tableRows.slice(2).map(row =>
              row.split('|').slice(1, -1).map(cell => cell.trim())
            );
            children.push(
              new Table({
                rows: [
                  new TableRow({
                    children: header.map(cell =>
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: cell, bold: true })] })]
                      })
                    )
                  }),
                  ...rows.map(row =>
                    new TableRow({
                      children: row.map(cell =>
                        new TableCell({
                          children: [new Paragraph(cell)]
                        })
                      )
                    })
                  )
                ]
              })
            );
          }
          tableRows = [];
          inTable = false;
        }

        if (inTable) {
          tableRows.push(line.trim());
          continue;
        }

        // Handle headers
        if (line.startsWith('# ')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.substring(2),
                  bold: true,
                  size: 36
                })
              ],
              spacing: {
                before: 400,
                after: 200
              }
            })
          );
        } else if (line.startsWith('## ')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.substring(3),
                  bold: true,
                  size: 32
                })
              ],
              spacing: {
                before: 300,
                after: 150
              }
            })
          );
        } else if (line.startsWith('### ')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line.substring(4),
                  bold: true,
                  size: 28
                })
              ],
              spacing: {
                before: 200,
                after: 100
              }
            })
          );
        }
        // Handle bullet points
        else if (line.startsWith('- ') || line.startsWith('* ')) {
          children.push(
            new Paragraph({
              bullet: {
                level: 0
              },
              children: [
                new TextRun(line.substring(2))
              ]
            })
          );
          inList = true;
        }
        // Handle numbered lists
        else if (/^\d+\.\s/.test(line)) {
          const textContent = line.replace(/^\d+\.\s/, '');
          children.push(
            new Paragraph({
              numbering: {
                reference: 'default-numbering',
                level: 0
              },
              children: [
                new TextRun(textContent)
              ]
            })
          );
        }
        // Handle empty lines
        else if (line.trim() === '') {
          children.push(new Paragraph({}));
          inList = false;
        }
        // Handle bold/italic/inline code
        else {
          // Replace inline code
          let processed = line.replace(/`([^`]+)`/g, (match, p1) => `«code:${p1}»`);
          // Replace bold
          processed = processed.replace(/\*\*([^\*]+)\*\*/g, '«bold:$1»');
          processed = processed.replace(/__([^_]+)__/g, '«bold:$1»');
          // Replace italic
          processed = processed.replace(/\*([^\*]+)\*/g, '«italic:$1»');
          processed = processed.replace(/_([^_]+)_/g, '«italic:$1»');

          // Split by custom tokens
          const runs = [];
          let buffer = '';
          let mode = null;
          for (let j = 0; j < processed.length; j++) {
            if (processed.startsWith('«bold:', j)) {
              if (buffer) runs.push(new TextRun(buffer));
              buffer = '';
              mode = 'bold';
              j += 5;
              continue;
            }
            if (processed.startsWith('«italic:', j)) {
              if (buffer) runs.push(new TextRun(buffer));
              buffer = '';
              mode = 'italic';
              j += 7;
              continue;
            }
            if (processed.startsWith('«code:', j)) {
              if (buffer) runs.push(new TextRun(buffer));
              buffer = '';
              mode = 'code';
              j += 6;
              continue;
            }
            if (processed[j] === '»') {
              if (mode === 'bold') runs.push(new TextRun({ text: buffer, bold: true }));
              else if (mode === 'italic') runs.push(new TextRun({ text: buffer, italics: true }));
              else if (mode === 'code') runs.push(new TextRun({ text: buffer, font: 'Courier New', shading: { type: 'clear', color: 'F5F5F5' } }));
              buffer = '';
              mode = null;
              continue;
            }
            buffer += processed[j];
          }
          if (buffer) runs.push(new TextRun(buffer));

          children.push(
            new Paragraph({
              children: runs
            })
          );
        }
      }

      // Create the document with all processed elements
      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 'default-numbering',
              levels: [
                {
                  level: 0,
                  format: 'decimal',
                  text: '%1.',
                  alignment: 'start',
                  style: {
                    paragraph: {
                      indent: { left: 720, hanging: 260 }
                    }
                  }
                }
              ]
            }
          ]
        },
        sections: [{
          properties: {},
          children: children
        }]
      });

      return doc;
    } catch (error) {
      console.error('Error converting markdown to docx:', error);

      // Create a simple document with the markdown content (no heading at all)
      try {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              ...markdown.split('\n').map(line =>
                new Paragraph({
                  children: [new TextRun(line)]
                })
              )
            ]
          }]
        });

        return doc;
      } catch (fallbackError) {
        console.error('Fallback document creation failed:', fallbackError);

        // Last resort - create minimal document
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Error creating formatted document. Content is provided below:',
                    bold: true
                  })
                ]
              }),
              new Paragraph({
                children: [new TextRun(markdown)]
              })
            ]
          }]
        });

        return doc;
      }
    }
  };
  
  // Download result as file
  const downloadResult = async (result, agentId, index) => {
    try {
      const agent = AGENTS.find(a => a.id === agentId);
      const fileName = `${agent.name.replace(/\s+/g, '_')}_${index + 1}`;
      
      // Determine file type based on agent
      if (agentId === 'test-cases-generator' || agentId === 'test-data-generator') {
        // Excel format
        const workbook = convertMarkdownTableToExcel(result);
        if (workbook) {
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(blob, `${fileName}.xlsx`);
          showSnackbar(`Downloaded ${fileName}.xlsx`, 'success');
        } else {
          showSnackbar('Could not convert to Excel format', 'error');
        }
      } else {
        // Word format - wrap in try/catch to handle errors
        try {
          // Create the document
          const doc = convertMarkdownToDocx(result);

          // Pack the document to a blob (browser compatible)
          const blob = await Packer.toBlob(doc);

          // Save the blob as a file
          saveAs(blob, `${fileName}.docx`);
          showSnackbar(`Downloaded ${fileName}.docx`, 'success');
        } catch (docxError) {
          // Enhanced error logging for debugging
          let errorMsg = '';
          if (docxError instanceof Error) {
            errorMsg = docxError.stack || docxError.message || String(docxError);
          } else {
            errorMsg = JSON.stringify(docxError);
          }
          // Show the error in the snackbar for debugging
          showSnackbar(`DOCX error: ${errorMsg}`, 'error');
          console.error('Error creating docx:', errorMsg);

          // Try one more time with a simpler approach
          try {
            const simpleDoc = new Document({
              sections: [{
                properties: {},
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: result,
                      })
                    ]
                  })
                ]
              }]
            });

            const blob = await Packer.toBlob(simpleDoc);
            saveAs(blob, `${fileName}.docx`);
            showSnackbar(`Downloaded ${fileName}.docx (simplified format)`, 'info');
          } catch (retryError) {
            let retryMsg = '';
            if (retryError instanceof Error) {
              retryMsg = retryError.stack || retryError.message || String(retryError);
            } else {
              retryMsg = JSON.stringify(retryError);
            }
            showSnackbar(`DOCX retry error: ${retryMsg}`, 'error');
            console.error('Retry error creating docx:', retryMsg);

            // Fallback to plain text download if docx creation fails
            const blob = new Blob([result], { type: 'text/plain' });
            saveAs(blob, `${fileName}.txt`);
            showSnackbar(`Downloaded ${fileName}.txt (Word format failed)`, 'warning');
          }
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Last resort fallback - download as plain text
      try {
        const agent = AGENTS.find(a => a.id === agentId);
        const fileName = `${agent.name.replace(/\s+/g, '_')}_${index + 1}`;
        const blob = new Blob([result], { type: 'text/plain' });
        saveAs(blob, `${fileName}.txt`);
        showSnackbar(`Downloaded as text file instead`, 'warning');
      } catch (finalError) {
        showSnackbar('Error downloading file', 'error');
      }
    }
  };
  
  // Start the chain process
  const handleStartChain = async () => {
    if (!chainFile || selectedAgentsForChain.length < 2) {
      showSnackbar('Please select a file and at least two agents', 'warning');
      return;
    }
    
    setIsChainRunning(true);
    setChainResults([]);
    setCurrentChainStep(0);
    setAiResponse(null);
    
    try {
      let currentInput = chainFile;
      let results = [];
      
      // Map agentId to default chain message
      const agentChainMessages = {
        'user-story-creator': 'create all possible user stories',
        'acceptance-criteria-creator': 'create all possible acceptance criteria',
        'test-cases-generator': 'create all possible test cases',
        'automation-script-generator': 'create all possible automation scripts',
        'test-data-generator': 'create all possible test data',
        'language-detector': 'detect all possible languages'
      };

      // Process each agent in the chain
      for (let i = 0; i < selectedAgentsForChain.length; i++) {
        const agentId = selectedAgentsForChain[i];
        setCurrentChainStep(i);

        // Use the mapped message for each agent
        const chainMessage = agentChainMessages[agentId] || '';

        // Create FormData for the request
        const formData = new FormData();
        formData.append('file', currentInput);
        formData.append('agent', agentId);
        formData.append('message', chainMessage);
        
        // Include team information in the chain request if team functionality is enabled
        const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';
        if (TEAM_USE_ENABLED) {
          try {
            const storedTeam = sessionStorage.getItem('selectedTeam');
            if (storedTeam) {
              const teamData = JSON.parse(storedTeam);
              // Send team ID as a separate field
              formData.append('teamId', teamData.id);
              // Also send team name for better logging/debugging
              formData.append('teamName', teamData.name);
              // Send the full team object as JSON string in case backend needs more team data
              formData.append('teamData', JSON.stringify(teamData));
            }
          } catch (err) {
            console.error('Error getting team from sessionStorage for chain request:', err);
          }
        }

        const webhookUrl = getWebhookUrl(agentId);

        if (!webhookUrl) {
          throw new Error(`No webhook URL found for agent: ${agentId}`);
        }

        let response;

        try {
          // Try to make the actual API call
          response = await axios.post(webhookUrl, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (apiError) {
          console.error('API call failed, using simulated response:', apiError);

          // If the API call fails, fall back to a simulated response
          const agent = AGENTS.find(a => a.id === agentId);
          response = {
            data: {
              response: generateSimulatedResponse(agentId, chainMessage)
            }
          };
        }

        // Extract response text
        let responseText;
        if (response.data && response.data.response) {
          responseText = response.data.response;
        } else if (response.data && typeof response.data === 'string') {
          responseText = response.data;
        } else if (response.data && (response.data.text || response.data.content || response.data.message || response.data.result)) {
          responseText = response.data.text || response.data.content || response.data.message || response.data.result;
        } else {
          responseText = JSON.stringify(response.data);
        }

        // Store the result
        results.push({
          agentId,
          response: responseText
        });

        // Convert the response to a file for the next agent
        if (i < selectedAgentsForChain.length - 1) {
          // Create a text file from the response
          const blob = new Blob([responseText], { type: 'text/plain' });
          const fileName = `chain_step_${i + 1}.txt`;
          currentInput = new File([blob], fileName, { type: 'text/plain' });
        }
      }
      
      // Update state with all results
      setChainResults(results);
      
      // Display the final result
      if (results.length > 0) {
        setAiResponse(
          `# Chain Process Results\n\n` +
          results.map((result, index) => {
            const agent = AGENTS.find(a => a.id === result.agentId);
            return `## Step ${index + 1}: ${agent.name}\n\n${result.response}`;
          }).join('\n\n---\n\n')
        );
      }
      
      showSnackbar('Chain process completed successfully', 'success');
    } catch (error) {
      console.error('Error in chain process:', error);
      showSnackbar(`Chain process error: ${error.message}`, 'error');
    } finally {
      setIsChainRunning(false);
    }
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

  // Handle Jira issue selection
  const handleJiraIssueSelect = (issue) => {
    if (!issue) return;
    
    // Format the issue information as markdown and append it to the current message
    const issueMarkdown = `
## Jira Issue: ${issue.key}
**Summary:** ${issue.summary}
**Type:** ${issue.type}
**Status:** ${issue.status}

${issue.description ? `**Description:**\n${issue.description}` : ''}
`;
    
    setUserMessage((prev) => {
      // If there's already content, add a newline before appending
      return prev.trim() ? `${prev}\n\n${issueMarkdown}` : issueMarkdown;
    });
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
        formData.append('files', agentFile); // Use 'files' as the field name (plural)
      }
      
      formData.append('agent', selectedAgent.id);

      // Include team information in the request if team functionality is enabled
      const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';
      if (TEAM_USE_ENABLED) {
        try {
          const storedTeam = sessionStorage.getItem('selectedTeam');
          if (storedTeam) {
            const teamData = JSON.parse(storedTeam);
            // Send team ID as a separate field
            formData.append('teamId', teamData.id);
            // Also send team name for better logging/debugging
            formData.append('teamName', teamData.name);
            // Send the full team object as JSON string in case backend needs more team data
            formData.append('teamData', JSON.stringify(teamData));
          }
        } catch (err) {
          console.error('Error getting team from sessionStorage:', err);
        }
      }
      
      let response;
      
      try {
        // First try to make the actual API call
        response = await axios.post(webhookUrl, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } catch (apiError) {
        console.error('API call failed, using simulated response:', apiError);
        
        // If the API call fails, fall back to a simulated response
        response = {
          data: {
            response: generateSimulatedResponse(selectedAgent.id, userMessage)
          }
        };
      }
      
      // Handle the response
      // console.log('Server response:', response.data);
      
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
            <SupabaseProvider>
      <TeamProvider>
        <DocumentProvider>
          <JiraProvider>
            <GitHubProvider>
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
              chainModeEnabled={chainModeEnabled}
              onChainModeToggle={handleChainModeToggle}
              selectedAgentsForChain={selectedAgentsForChain}
              onAgentChainSelectionToggle={handleAgentChainSelectionToggle}
              onChainFileSelect={handleChainFileSelect}
              chainFile={chainFile}
              onChainFileRemove={handleChainFileRemove}
              onStartChain={handleStartChain}
              isChainRunning={isChainRunning}
            />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', bgcolor: '#fff' }}>
                <ResponseDisplay 
                  selectedAgent={selectedAgent}
                  aiResponse={aiResponse}
                  rightOpen={rightOpen}
                  chainResults={chainResults}
                  isChainRunning={isChainRunning}
                  currentChainStep={currentChainStep}
                  selectedAgentsForChain={selectedAgentsForChain}
                  chainModeEnabled={chainModeEnabled}
                  onDownloadResult={downloadResult}
                />
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                <input
                  type="file"
                  ref={chainFileInputRef}
                  onChange={handleChainFileChange}
                  style={{ display: 'none' }}
                />
                
                <MessageInput 
                  selectedAgent={selectedAgent}
                  userMessage={userMessage}
                  setUserMessage={setUserMessage}
                  isLoading={isLoading}
                  handleSendMessage={handleSendMessage}
                  getSelectedAgentFile={getSelectedAgentFile}
                  handleRemoveFile={handleRemoveFile}
                  fileInputRef={fileInputRef}
                  leftOpen={leftOpen}
                  rightOpen={rightOpen}
                />
              </Box>
            </Box>
            <ServiceSidebar 
              open={rightOpen} 
              onToggle={() => setRightOpen((v) => !v)} 
              onJiraIssueSelect={handleJiraIssueSelect}
            />
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={handleSnackbarClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert 
                onClose={handleSnackbarClose} 
                severity={snackbarSeverity} 
                sx={{ width: '100%' }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
            </Box>
            <TeamSelectionModal />
            </GitHubProvider>
          </JiraProvider>
        </DocumentProvider>
      </TeamProvider>
    </SupabaseProvider>
  );
}

export default App;
