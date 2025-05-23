import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const GitHubContext = createContext();

// Custom hook to use the GitHub context
export const useGitHub = () => useContext(GitHubContext);

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const GitHubProvider = ({ children }) => {
  // Get the GitHub URL from environment variables
  const envGitHubUrl = import.meta.env.VITE_GITHUB_AUTOMATION_FRAMEWORK_URL || '';

  // State for GitHub configuration
  const [githubConfig, setGithubConfig] = useState({
    url: envGitHubUrl,
    pat: '',
    isConnected: !!envGitHubUrl,
    selectedBranch: 'main',
    branches: []
  });

  // Load saved configuration from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('githubConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // If there's a URL in the environment variable, it takes precedence
        if (envGitHubUrl) {
          setGithubConfig(prev => ({
            ...parsedConfig,
            url: envGitHubUrl,
            isConnected: true
          }));
        } else {
          setGithubConfig(parsedConfig);
        }
      } catch (error) {
        console.error('Error parsing saved GitHub config:', error);
      }
    }
  }, [envGitHubUrl]);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('githubConfig', JSON.stringify(githubConfig));
  }, [githubConfig]);

  // Function to test connection to GitHub
  const testConnection = async (url, pat = '') => {
    try {
      // Add delay before API call
      await delay(1000);
      
      // Construct the API URL based on the repository URL
      // Example: Convert https://github.com/owner/repo to https://api.github.com/repos/owner/repo
      const repoPath = url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const apiUrl = `https://api.github.com/repos/${repoPath}`;
      
      // Set up headers for the request
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      // Add authorization header if PAT is provided
      if (pat) {
        headers['Authorization'] = `token ${pat}`;
      }
      
      // Make the request
      const response = await fetch(apiUrl, { headers });
      
      if (response.status === 404) {
        return { success: false, error: 'Repository not found. Please check the URL or access permissions.' };
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || `Error: ${response.status}` };
      }
      
      // If we get here, the connection was successful
      const repoData = await response.json();
      
      // Add delay before fetching branches
      await delay(1000);
      
      // Fetch branches
      const branchesUrl = `https://api.github.com/repos/${repoPath}/branches`;
      const branchesResponse = await fetch(branchesUrl, { headers });
      
      let branches = [];
      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        branches = branchesData.map(branch => branch.name);
      }
      
      return { 
        success: true, 
        data: repoData,
        branches
      };
    } catch (error) {
      console.error('Error testing GitHub connection:', error);
      return { success: false, error: error.message || 'Failed to connect to GitHub' };
    }
  };

  // Function to connect to GitHub
  const connect = async (url, pat = '') => {
    try {
      const result = await testConnection(url, pat);
      
      if (result.success) {
        // Update the configuration with the new values
        setGithubConfig({
          url,
          pat, // Store PAT in memory (not in localStorage for security)
          isConnected: true,
          selectedBranch: result.branches.includes('main') ? 'main' : 
                         result.branches.includes('master') ? 'master' : 
                         result.branches[0] || '',
          branches: result.branches
        });
        
        return { success: true };
      } else {
        return result; // Return the error from testConnection
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      return { success: false, error: error.message || 'Failed to connect to GitHub' };
    }
  };

  // Function to disconnect from GitHub
  const disconnect = () => {
    // Only clear the connection if it's not set in the environment variable
    if (!envGitHubUrl) {
      setGithubConfig({
        url: '',
        pat: '',
        isConnected: false,
        selectedBranch: 'main',
        branches: []
      });
    } else {
      // If URL is from env var, just clear the PAT
      setGithubConfig(prev => ({
        ...prev,
        pat: ''
      }));
    }
    
    return { success: true };
  };

  // Function to change the selected branch
  const changeBranch = (branchName) => {
    if (githubConfig.branches.includes(branchName)) {
      setGithubConfig(prev => ({
        ...prev,
        selectedBranch: branchName
      }));
      return { success: true };
    }
    return { success: false, error: 'Invalid branch name' };
  };

  // Function to fetch repository contents
  const fetchContents = async (path = '') => {
    try {
      if (!githubConfig.isConnected) {
        return { success: false, error: 'Not connected to GitHub' };
      }
      
      // Add delay before API call
      await delay(1000);
      
      // Construct the API URL based on the repository URL and path
      const repoPath = githubConfig.url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      // Format the path correctly for the API URL
      const pathSegment = path ? `/${path}` : '';
      const apiUrl = `https://api.github.com/repos/${repoPath}/contents${pathSegment}?ref=${githubConfig.selectedBranch}`;
      
      // console.log('Fetching contents from:', apiUrl);
      
      // Set up headers for the request
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      // Add authorization header if PAT is provided
      if (githubConfig.pat) {
        headers['Authorization'] = `token ${githubConfig.pat}`;
      }
      
      // Make the request
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || `Error: ${response.status}` };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching GitHub contents:', error);
      return { success: false, error: error.message || 'Failed to fetch repository contents' };
    }
  };

  // Function to fetch file content
  const fetchFileContent = async (path) => {
    try {
      if (!githubConfig.isConnected) {
        return { success: false, error: 'Not connected to GitHub' };
      }
      
      // Add delay before API call
      await delay(1000);
      
      // Construct the API URL based on the repository URL and path
      const repoPath = githubConfig.url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const apiUrl = `https://api.github.com/repos/${repoPath}/contents/${path}?ref=${githubConfig.selectedBranch}`;
      
      // console.log('Fetching file content from:', apiUrl);
      
      // Set up headers for the request
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      // Add authorization header if PAT is provided
      if (githubConfig.pat) {
        headers['Authorization'] = `token ${githubConfig.pat}`;
      }
      
      // Make the request
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || `Error: ${response.status}` };
      }
      
      const data = await response.json();
      
      // GitHub API returns content as base64 encoded
      if (data.encoding === 'base64' && data.content) {
        const content = atob(data.content.replace(/\n/g, ''));
        return { 
          success: true, 
          data: {
            content,
            sha: data.sha,
            name: data.name,
            path: data.path,
            url: data.html_url
          } 
        };
      } else {
        return { success: false, error: 'Unsupported file encoding' };
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      return { success: false, error: error.message || 'Failed to fetch file content' };
    }
  };

  // Provide the context value
  const contextValue = {
    githubConfig,
    testConnection,
    connect,
    disconnect,
    changeBranch,
    fetchContents,
    fetchFileContent
  };

  return (
    <GitHubContext.Provider value={contextValue}>
      {children}
    </GitHubContext.Provider>
  );
};
