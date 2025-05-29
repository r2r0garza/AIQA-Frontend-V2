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

  // Utility to get sanitized backend URL (no trailing slash)
  const getJiraBackendUrl = () => {
    let url = import.meta.env.VITE_JIRA_API_BACKEND || '';
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  };

  // Fetch Jira projects (real or simulated based on VITE_DEMO_JIRA)
  const fetchJiraProjects = async () => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }

    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));

    const isDemo = import.meta.env.VITE_DEMO_JIRA === 'true';

    if (isDemo) {
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
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira projects' }));
        return { success: false, error: error.message || 'Failed to fetch Jira projects' };
      }
    } else {
      try {
        const backendUrl = getJiraBackendUrl();
        const res = await fetch(`${backendUrl}/api/jira/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jira_url: import.meta.env.VITE_JIRA_API_URL,
            email: import.meta.env.VITE_JIRA_EMAIL,
            pat: import.meta.env.VITE_JIRA_API_TOKEN
          })
        });
        if (!res.ok) {
          throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
        }
        let projects = await res.json();
        // Defensive: handle array or object response
        if (Array.isArray(projects)) {
          // OK
        } else if (projects && Array.isArray(projects.projects)) {
          projects = projects.projects;
        } else if (projects && Array.isArray(projects.data)) {
          projects = projects.data;
        } else {
          projects = [];
        }
        setJiraConfig(prev => ({ ...prev, loading: false }));
        return { success: true, data: projects };
      } catch (error) {
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira projects' }));
        return { success: false, error: error.message || 'Failed to fetch Jira projects' };
      }
    }
  };

  // Fetch Jira issues for a project (real or simulated)
  const fetchJiraIssues = async (projectKey) => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }

    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));

    const isDemo = import.meta.env.VITE_DEMO_JIRA === 'true';

    if (isDemo) {
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
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira issues' }));
        return { success: false, error: error.message || 'Failed to fetch Jira issues' };
      }
    } else {
      try {
        const backendUrl = getJiraBackendUrl();
        const res = await fetch(
          `${backendUrl}/api/jira/project/items?project_key=${encodeURIComponent(projectKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jira_url: import.meta.env.VITE_JIRA_API_URL,
              email: import.meta.env.VITE_JIRA_EMAIL,
              pat: import.meta.env.VITE_JIRA_API_TOKEN
            })
          }
        );
        if (!res.ok) {
          throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
        }
        let issues = await res.json();
        // Debug: log the raw response for troubleshooting
        console.log('Jira API project items response:', issues);

        // Defensive: handle array or object response
        if (Array.isArray(issues)) {
          // OK
        } else if (issues && Array.isArray(issues.items)) {
          issues = issues.items;
        } else if (issues && Array.isArray(issues.issues)) {
          issues = issues.issues;
        } else if (issues && Array.isArray(issues.data)) {
          issues = issues.data;
        } else {
          issues = [];
        }

        // Defensive: map issues to expected shape if needed
        issues = issues.map(issue => {
          // If already has id, key, summary, type, return as is
          if (issue && issue.id && issue.key && issue.summary && (issue.type || issue.issuetype)) {
            return {
              ...issue,
              type: issue.type || issue.issuetype || ''
            };
          }
          // Try to map common Jira fields
          return {
            id: issue.id || issue.issueId || issue.key || '',
            key: issue.key || issue.issueKey || '',
            summary: issue.summary || issue.title || issue.name || '',
            type: issue.type || issue.issuetype || issue.issueType || '',
            ...issue
          };
        });

        setJiraConfig(prev => ({ ...prev, loading: false }));
        return { success: true, data: issues };
      } catch (error) {
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira issues' }));
        return { success: false, error: error.message || 'Failed to fetch Jira issues' };
      }
    }
  };

  // Get issue details (real or simulated)
  const getJiraIssueDetails = async (issueId) => {
    if (!jiraConfig.isConnected) {
      return { success: false, error: 'Not connected to Jira' };
    }

    setJiraConfig(prev => ({ ...prev, loading: true, error: null }));

    const isDemo = import.meta.env.VITE_DEMO_JIRA === 'true';

    if (isDemo) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Simulated issue data
        const issue = {
          id: '1001',
          key: issueId,
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
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira issue details' }));
        return { success: false, error: error.message || 'Failed to fetch Jira issue details' };
      }
    } else {
      try {
        const backendUrl = getJiraBackendUrl();
        const res = await fetch(
          `${backendUrl}/api/jira/issue/details?issue_id=${encodeURIComponent(issueId)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jira_url: import.meta.env.VITE_JIRA_API_URL,
              email: import.meta.env.VITE_JIRA_EMAIL,
              pat: import.meta.env.VITE_JIRA_API_TOKEN
            })
          }
        );
        if (!res.ok) {
          throw new Error(`Jira API error: ${res.status} ${res.statusText}`);
        }
        const issue = await res.json();
        // Debug: log the raw issue details response
        console.log('Jira API issue details response:', issue);

        // Map backend fields to expected frontend fields
        let assigneeName = '';
        if (issue.assignee && typeof issue.assignee === 'object') {
          assigneeName = issue.assignee.displayName || 'Unassigned';
        } else if (typeof issue.assignee === 'string') {
          assigneeName = issue.assignee;
        } else {
          assigneeName = 'Unassigned';
        }

        const mappedIssue = {
          summary: issue.summary || '',
          key: issue.key || '', // fallback to empty string if not present
          type: issue.type || issue.issuetype_name || '',
          status: issue.status || issue.statusCategory_name || '',
          assignee: assigneeName,
          description: issue.description || issue.description_text || '',
          // include all other fields for safety
          ...issue
        };

        setJiraConfig(prev => ({ ...prev, loading: false }));
        return { success: true, data: mappedIssue };
      } catch (error) {
        setJiraConfig(prev => ({ ...prev, loading: false, error: error.message || 'Failed to fetch Jira issue details' }));
        return { success: false, error: error.message || 'Failed to fetch Jira issue details' };
      }
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
