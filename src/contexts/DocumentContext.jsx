import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';
import { useTeam } from './TeamContext';

// Create context
const DocumentContext = createContext();

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

export function useDocument() {
  return useContext(DocumentContext);
}

export function DocumentProvider({ children }) {
  const { supabase, isConnected, documents, documentTypes, loading, error, fetchDocuments } = useSupabase();
  const { selectedTeam } = useTeam();
  const [documentBrowserOpen, setDocumentBrowserOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  
  // Refresh documents when connection status or selected team changes
  useEffect(() => {
    if (isConnected) {
      // Only filter by team if team functionality is enabled
      const teamName = TEAM_USE_ENABLED ? selectedTeam?.name : null;
      fetchDocuments(supabase, teamName);
    }
  }, [isConnected, fetchDocuments, supabase, selectedTeam]);
  
  const openDocumentBrowser = () => {
    setDocumentBrowserOpen(true);
  };
  
  const closeDocumentBrowser = () => {
    setDocumentBrowserOpen(false);
    setSelectedDocuments([]);
  };

  const toggleDocumentSelection = (documentId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const selectAllDocuments = () => {
    if (documents.length === selectedDocuments.length) {
      // If all are selected, deselect all
      setSelectedDocuments([]);
    } else {
      // Otherwise, select all
      setSelectedDocuments(documents.map(doc => doc.id));
    }
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  const openBatchUpload = () => {
    setBatchUploadOpen(true);
  };

  const closeBatchUpload = () => {
    setBatchUploadOpen(false);
  };
  
  const value = {
    documentBrowserOpen,
    openDocumentBrowser,
    closeDocumentBrowser,
    selectedDocuments,
    setSelectedDocuments,
    toggleDocumentSelection,
    selectAllDocuments,
    clearDocumentSelection,
    batchUploadOpen,
    openBatchUpload,
    closeBatchUpload
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}
