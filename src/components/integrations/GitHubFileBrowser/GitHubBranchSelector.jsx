import React from 'react';
import { useGitHub } from '../../../contexts/GitHubContext';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';

function GitHubBranchSelector() {
  const { githubConfig, changeBranch } = useGitHub();

  const handleBranchChange = (event) => {
    changeBranch(event.target.value);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl 
        fullWidth 
        variant="outlined" 
        size="small"
        sx={{ minWidth: 120 }}
      >
        <InputLabel 
          id="branch-select-label"
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Branch
        </InputLabel>
        <Select
          labelId="branch-select-label"
          value={githubConfig.selectedBranch}
          onChange={handleBranchChange}
          label="Branch"
          sx={{
            color: '#fff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.3)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.5)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1e1e1e',
                color: '#fff',
                '& .MuiMenuItem-root:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
                '& .MuiMenuItem-root.Mui-selected': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                },
                '& .MuiMenuItem-root.Mui-selected:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.3)',
                },
              },
            },
          }}
        >
          {githubConfig.branches.map((branch) => (
            <MenuItem key={branch} value={branch}>
              {branch}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export default GitHubBranchSelector;
