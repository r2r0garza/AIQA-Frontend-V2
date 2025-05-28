import React, { useState, useEffect } from 'react';
import { useJira } from '../../contexts/JiraContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Divider,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ErrorIcon from '@mui/icons-material/Error';

function JiraProjectBrowser({ open, onClose, onSelect }) {
  const { jiraConfig, fetchJiraProjects, fetchJiraIssues, getJiraIssueDetails } = useJira();
  
  const [view, setView] = useState('projects'); // 'projects', 'issues', 'issue-details'
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Load projects when the dialog opens
  useEffect(() => {
    if (open && view === 'projects') {
      loadProjects();
    }
  }, [open]);
  
  const loadProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await fetchJiraProjects();
      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err) {
      setError('Error loading projects: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const loadIssues = async (project) => {
    setSelectedProject(project);
    setView('issues');
    setLoading(true);
    setError('');

    // Defensive: try both project.key and project.id
    const projectKey = project.key || project.id || '';
    if (!projectKey) {
      setError('Project key is missing.');
      setLoading(false);
      return;
    }

    try {
      const result = await fetchJiraIssues(projectKey);
      if (result.success) {
        setIssues(result.data);
      } else {
        setError(result.error || 'Failed to load issues');
      }
    } catch (err) {
      setError('Error loading issues: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const loadIssueDetails = async (issue) => {
    setSelectedIssue(issue);
    setView('issue-details');
    setLoading(true);
    setError('');
    
    try {
      const result = await getJiraIssueDetails(issue.key);
      if (result.success) {
        setSelectedIssue(result.data);
      } else {
        setError(result.error || 'Failed to load issue details');
      }
    } catch (err) {
      setError('Error loading issue details: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectIssue = () => {
    if (selectedIssue) {
      onSelect(selectedIssue);
      onClose();
    }
  };
  
  const handleNavigateBack = () => {
    if (view === 'issues') {
      setView('projects');
      setSelectedProject(null);
    } else if (view === 'issue-details') {
      setView('issues');
      setSelectedIssue(null);
    }
  };
  
  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />}
        sx={{ mb: 2, color: '#fff' }}
      >
        <Link 
          color="inherit" 
          sx={{ 
            cursor: 'pointer',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
          onClick={() => setView('projects')}
        >
          Projects
        </Link>
        
        {view === 'issues' && selectedProject && (
          <Typography color="rgba(255,255,255,0.7)">{selectedProject.name}</Typography>
        )}
        
        {view === 'issue-details' && (
          <>
            {selectedProject && (
              <Link 
                color="inherit" 
                sx={{ 
                  cursor: 'pointer',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => setView('issues')}
              >
                {selectedProject.name}
              </Link>
            )}
            <Typography color="rgba(255,255,255,0.7)">{selectedIssue?.key}</Typography>
          </>
        )}
      </Breadcrumbs>
    );
  };
  
  const renderProjects = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
          icon={<ErrorIcon sx={{ color: '#f44336' }} />}
        >
          {error}
        </Alert>
      );
    }
    
    if (projects.length === 0) {
      return (
        <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          No projects found
        </Typography>
      );
    }
    
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {projects.map((project) => (
          <ListItem key={project.id} disablePadding>
            <ListItemButton 
              onClick={() => loadIssues(project)}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <FolderIcon sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText 
                primary={project.name} 
                secondary={project.key}
                primaryTypographyProps={{ sx: { color: '#fff' } }}
                secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };
  
  const renderIssues = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
          icon={<ErrorIcon sx={{ color: '#f44336' }} />}
        >
          {error}
        </Alert>
      );
    }
    
    if (issues.length === 0) {
      return (
        <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          No issues found in this project
        </Typography>
      );
    }
    
    return (
      <List sx={{ width: '100%', p: 0 }}>
        {issues.map((issue) => (
          <ListItem key={issue.id} disablePadding>
            <ListItemButton 
              onClick={() => loadIssueDetails(issue)}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <DescriptionIcon sx={{ mr: 2, color: issue.type === 'Bug' ? '#f44336' : '#4caf50' }} />
              <ListItemText 
                primary={issue.summary} 
                secondary={issue.key}
                primaryTypographyProps={{ sx: { color: '#fff' } }}
                secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };
  
  const renderIssueDetails = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
          icon={<ErrorIcon sx={{ color: '#f44336' }} />}
        >
          {error}
        </Alert>
      );
    }
    
    if (!selectedIssue) {
      return (
        <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          Issue details not available
        </Typography>
      );
    }
    
    return (
      <Box>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          {selectedIssue.summary}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
            Key:
          </Typography>
          <Typography sx={{ color: '#fff' }}>
            {selectedIssue.key}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
            Type:
          </Typography>
          <Typography sx={{ color: '#fff' }}>
            {selectedIssue.type}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
            Status:
          </Typography>
          <Typography sx={{ color: '#fff' }}>
            {selectedIssue.status}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
            Assignee:
          </Typography>
          <Typography sx={{ color: '#fff' }}>
            {selectedIssue.assignee || 'Unassigned'}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
            Description:
          </Typography>
          <Typography sx={{ color: '#fff', whiteSpace: 'pre-wrap' }}>
            {selectedIssue.description || 'No description provided'}
          </Typography>
        </Box>
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          color: '#fff',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          Jira Browser
          {view !== 'projects' && (
            <Button 
              size="small" 
              onClick={handleNavigateBack}
              sx={{ ml: 2, color: 'rgba(255,255,255,0.7)' }}
            >
              Back
            </Button>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {renderBreadcrumbs()}
        
        {view === 'projects' && renderProjects()}
        {view === 'issues' && renderIssues()}
        {view === 'issue-details' && renderIssueDetails()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Cancel
        </Button>
        
        {view === 'issue-details' && (
          <Button 
            onClick={handleSelectIssue} 
            variant="contained"
            disabled={!selectedIssue}
          >
            Import Issue
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default JiraProjectBrowser;
