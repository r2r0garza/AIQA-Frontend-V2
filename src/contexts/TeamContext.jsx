import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';

// Create context
const TeamContext = createContext();

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }) {
  const { supabase, isConnected } = useSupabase();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTeamSelectionModal, setShowTeamSelectionModal] = useState(false);

  // Check if a team is already selected in session storage
  useEffect(() => {
    // If team functionality is disabled, don't show team selection modal
    if (!TEAM_USE_ENABLED) {
      setShowTeamSelectionModal(false);
      return;
    }

    const storedTeam = sessionStorage.getItem('selectedTeam');
    if (storedTeam) {
      try {
        setSelectedTeam(JSON.parse(storedTeam));
      } catch (err) {
        console.error('Error parsing stored team:', err);
        sessionStorage.removeItem('selectedTeam');
      }
    } else if (isConnected) {
      // If no team is selected and we're connected to Supabase, show the team selection modal
      setShowTeamSelectionModal(true);
    }
  }, [isConnected]);

  // Fetch teams from Supabase
  const fetchTeams = React.useCallback(async () => {
    if (!supabase || !isConnected) {
      setTeams([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('team')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, isConnected]);

  // Select a team
  const selectTeam = (team) => {
    setSelectedTeam(team);
    sessionStorage.setItem('selectedTeam', JSON.stringify(team));
    setShowTeamSelectionModal(false);
  };

  // Add a new team
  const addTeam = async (name) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('team')
        .insert([{ name }])
        .select();

      if (error) throw error;

      // Refresh teams
      await fetchTeams();

      return data[0];
    } catch (err) {
      console.error('Error adding team:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a team
  const deleteTeam = async (id) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('team')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh teams
      await fetchTeams();

      // If the deleted team was selected, clear the selection
      if (selectedTeam && selectedTeam.id === id) {
        setSelectedTeam(null);
        sessionStorage.removeItem('selectedTeam');
        setShowTeamSelectionModal(true);
      }

      return true;
    } catch (err) {
      console.error('Error deleting team:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Open team selection modal
  const openTeamSelectionModal = () => {
    setShowTeamSelectionModal(true);
  };

  // Close team selection modal
  const closeTeamSelectionModal = () => {
    // Only allow closing if a team is selected
    if (selectedTeam) {
      setShowTeamSelectionModal(false);
    }
  };

  const value = {
    teams,
    selectedTeam,
    loading,
    error,
    showTeamSelectionModal,
    fetchTeams,
    selectTeam,
    addTeam,
    deleteTeam,
    openTeamSelectionModal,
    closeTeamSelectionModal
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
