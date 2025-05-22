import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { useTeam } from '../contexts/TeamContext';

function TeamSelectionModal() {
  const {
    teams,
    selectedTeam,
    loading,
    error,
    showTeamSelectionModal,
    fetchTeams,
    selectTeam,
    addTeam,
    closeTeamSelectionModal
  } = useTeam();

  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [teamNameError, setTeamNameError] = useState('');

  // Fetch teams when the modal is opened
  useEffect(() => {
    if (showTeamSelectionModal) {
      fetchTeams();
    }
  }, [showTeamSelectionModal, fetchTeams]);

  // Set the selected value when teams are loaded or selected team changes
  useEffect(() => {
    if (selectedTeam) {
      setSelectedValue(selectedTeam.id);
    } else {
      setSelectedValue('');
    }
  }, [selectedTeam, teams]);

  // Handle dropdown selection change
  const handleDropdownChange = (event) => {
    const value = event.target.value;
    
    if (value === 'add_new') {
      setShowAddTeamForm(true);
      return;
    }
    
    const team = teams.find(t => t.id === value);
    if (team) {
      // Select the team - this will trigger document fetching in DocumentContext
      // The fetchDocuments function in SupabaseContext will fetch both team-specific
      // and global documents (where team is null)
      selectTeam(team);
    }
  };

  // Handle adding a new team
  const handleAddTeam = async () => {
    if (!newTeamName.trim()) return;

    // Check if team name already exists
    const teamExists = teams.some(team => 
      team.name.toLowerCase() === newTeamName.trim().toLowerCase()
    );
    
    if (teamExists) {
      setTeamNameError('A team with this name already exists');
      return;
    }

    setTeamNameError('');
    setAddingTeam(true);
    const result = await addTeam(newTeamName.trim());
    setAddingTeam(false);

    if (result) {
      setNewTeamName('');
      setShowAddTeamForm(false);
      selectTeam(result); // Select the newly created team
    }
  };

  // Handle cancel adding new team
  const handleCancelAddTeam = () => {
    setShowAddTeamForm(false);
    setNewTeamName('');
    setTeamNameError('');
    setSelectedValue(selectedTeam ? selectedTeam.id : '');
  };

  return (
    <Dialog
      open={showTeamSelectionModal}
      onClose={closeTeamSelectionModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#121212',
          color: '#fff',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle>Select Your Team</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please select the team you belong to. This will determine which documents you can access.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {teams.length === 0 && !showAddTeamForm ? (
              <Typography sx={{ py: 2, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                No teams found. Please add a team.
              </Typography>
            ) : !showAddTeamForm ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="team-select-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Select Team
                </InputLabel>
                <Select
                  labelId="team-select-label"
                  id="team-select"
                  value={selectedValue}
                  onChange={handleDropdownChange}
                  label="Select Team"
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
                    },
                    '.MuiSvgIcon-root': {
                      color: 'rgba(255,255,255,0.7)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: '#1e1e1e',
                        color: '#fff',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.1)'
                          },
                          '&.Mui-selected': {
                            bgcolor: 'rgba(25, 118, 210, 0.2)',
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.3)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="add_new" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                    ADD NEW TEAM
                  </MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            {showAddTeamForm ? (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Team Name"
                  value={newTeamName}
                  onChange={(e) => {
                    setNewTeamName(e.target.value);
                    setTeamNameError('');
                  }}
                  variant="outlined"
                  size="small"
                  disabled={addingTeam}
                  error={!!teamNameError}
                  helperText={teamNameError}
                  InputLabelProps={{
                    sx: { color: 'rgba(255,255,255,0.7)' }
                  }}
                  InputProps={{
                    sx: {
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
                    }
                  }}
                  FormHelperTextProps={{
                    sx: {
                      color: 'error.main'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    onClick={handleCancelAddTeam}
                    sx={{ color: 'rgba(255,255,255,0.7)', mr: 1 }}
                    disabled={addingTeam}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleAddTeam}
                    disabled={!newTeamName.trim() || addingTeam}
                    startIcon={addingTeam ? <CircularProgress size={16} /> : null}
                  >
                    {addingTeam ? 'Adding...' : 'Add Team'}
                  </Button>
                </Box>
              </Box>
            ) : null}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={closeTeamSelectionModal}
          disabled={!selectedTeam}
          sx={{ color: selectedTeam ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TeamSelectionModal;
