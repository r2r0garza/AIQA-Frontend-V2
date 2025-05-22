import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress
} from '@mui/material';
import { useTeam } from '../contexts/TeamContext';

function TeamSelector() {
  const {
    teams,
    selectedTeam,
    loading,
    fetchTeams,
    selectTeam,
    openTeamSelectionModal
  } = useTeam();

  // Fetch teams when the component mounts
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Handle team change
  const handleTeamChange = (event) => {
    const teamId = event.target.value;
    const team = teams.find(t => t.id === teamId);
    if (team) {
      selectTeam(team);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
        Current Team
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {selectedTeam ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControl 
                fullWidth 
                variant="outlined" 
                size="small"
                sx={{ mr: 1 }}
              >
                <InputLabel id="team-selector-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Team
                </InputLabel>
                <Select
                  labelId="team-selector-label"
                  value={selectedTeam.id}
                  onChange={handleTeamChange}
                  label="Team"
                  sx={{ 
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="outlined"
                onClick={openTeamSelectionModal}
                sx={{
                  minWidth: 'auto',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Manage
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              onClick={openTeamSelectionModal}
              fullWidth
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Select Team
            </Button>
          )}
        </>
      )}
    </Box>
  );
}

export default TeamSelector;
