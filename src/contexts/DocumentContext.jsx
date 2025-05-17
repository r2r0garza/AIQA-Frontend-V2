import React, { createContext, useContext, useState } from 'react';

// Create context
const DocumentContext = createContext();

export function useDocument() {
  return useContext(DocumentContext);
}

export function DocumentProvider({ children }) {
  const [documentBrowserOpen, setDocumentBrowserOpen] = useState(false);
  
  const openDocumentBrowser = () => {
    setDocumentBrowserOpen(true);
  };
  
  const closeDocumentBrowser = () => {
    setDocumentBrowserOpen(false);
  };
  
  const value = {
    documentBrowserOpen,
    openDocumentBrowser,
    closeDocumentBrowser
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}
