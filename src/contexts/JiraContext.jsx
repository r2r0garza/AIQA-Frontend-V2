import React, { createContext, useState, useContext } from 'react';

// Create the context
const JiraContext = createContext();

// Create a provider component
export function JiraProvider({ children }) {
  // Initialize with environment variables if available
  const [jiraConfig, setJiraConfig] = useState({
    isConnected: !!(import.meta.env.VITE_JIRA_EMAIL && import.meta.env.VITE_JIRA_API_TOKEN),
    url: import.meta.env.VITE_JIRA_API_URL || '',
    email: import.meta.env.VITE_JIRA_EMAIL || '',
    token: import.meta.env.VITE_JIRA_API_TOKEN || '',
    loading: false,
    error: null
  });

  // Connect to Jira
  const connectToJira = async (url, email, token) => {
    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // In a real implementation, we would make an API call to validate the credentials
      // For now, we'll simulate a successful connection after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setJiraConfig({
        isConnected: true,
        url,
        email,
        token,
        loading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      setJiraConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to connect to Jira'
      }));
      
      return { success: false, error: error.message || 'Failed to connect to Jira' };
    }
  };

  // Disconnect from Jira
  const disconnectFromJira = () => {
    setJiraConfig({
      isConnected: false,
      url: import.meta.env.VITE_JIRA_API_URL || '',
      email: import.meta.env.VITE_JIRA_EMAIL || '',
      token: import.meta.env.VITE_JIRA_API_TOKEN || '',
      loading: false,
      error: null
    });
  };

  // Fetch Jira projects (simulated)
  const fetchJiraProjects = async () => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }
    
    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated projects data
      const projects = [
        { id: 'PROJ1', key: 'PROJ1', name: 'Project One' },
        { id: 'PROJ2', key: 'PROJ2', name: 'Project Two' },
        { id: 'PROJ3', key: 'PROJ3', name: 'Project Three' }
      ];
      
      setJiraConfig(prev => ({ ...prev, loading: false }));
      
      return { success: true, data: projects };
    } catch (error) {
      setJiraConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch Jira projects'
      }));
      
      return { success: false, error: error.message || 'Failed to fetch Jira projects' };
    }
  };

  // Fetch Jira issues for a project (simulated)
  const fetchJiraIssues = async (projectKey) => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }
    
    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated issues data
      const issues = [
        { id: '1001', key: `${projectKey}-1`, summary: 'Implement login feature', type: 'Story' },
        { id: '1002', key: `${projectKey}-2`, summary: 'Fix navigation bug', type: 'Bug' },
        { id: '1003', key: `${projectKey}-3`, summary: 'Update documentation', type: 'Task' }
      ];
      
      setJiraConfig(prev => ({ ...prev, loading: false }));
      
      return { success: true, data: issues };
    } catch (error) {
      setJiraConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch Jira issues'
      }));
      
      return { success: false, error: error.message || 'Failed to fetch Jira issues' };
    }
  };

  // Get issue details (simulated)
  const getJiraIssueDetails = async (issueKey) => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }
    
    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated issue data
      const issue = {
        id: '1001',
        key: issueKey,
        summary: 'Implement login feature',
        description: 'As a user, I want to be able to log in to the system so that I can access my account.',
        type: 'Story',
        status: 'In Progress',
        assignee: 'John Doe',
        reporter: 'Jane Smith',
        priority: 'Medium',
        created: '2023-05-10T10:00:00.000Z',
        updated: '2023-05-12T14:30:00.000Z'
      };
      
      setJiraConfig(prev => ({ ...prev, loading: false }));
      
      return { success: true, data: issue };
    } catch (error) {
      setJiraConfig(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch Jira issue details'
      }));
      
      return { success: false, error: error.message || 'Failed to fetch Jira issue details' };
    }
  };

  // Context value
  const value = {
    jiraConfig,
    connectToJira,
    disconnectFromJira,
    fetchJiraProjects,
    fetchJiraIssues,
    getJiraIssueDetails
  };

  return <JiraContext.Provider value={value}>{children}</JiraContext.Provider>;
}

// Custom hook to use the Jira context
export function useJira() {
  const context = useContext(JiraContext);
  if (context === undefined) {
    throw new Error('useJira must be used within a JiraProvider');
  }
  return context;
}
