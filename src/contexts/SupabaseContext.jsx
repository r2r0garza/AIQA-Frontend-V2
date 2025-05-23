import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create context
const SupabaseContext = createContext();

// Check if team functionality is enabled from environment variable
const TEAM_USE_ENABLED = import.meta.env.VITE_TEAM_USE !== 'false';

export function useSupabase() {
  return useContext(SupabaseContext);
}

export function SupabaseProvider({ children }) {
  const [supabase, setSupabase] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_SECRET || '');
  
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Supabase client if URL and key are available
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      connectToSupabase(supabaseUrl, supabaseKey);
    }
  }, []);

  // Connect to Supabase
  const connectToSupabase = async (url, key) => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      // Create a new Supabase client
      const client = createClient(url, key);
      
      // Test the connection
      const { error } = await client.from('document').select('count', { count: 'exact', head: true });
      
      if (error) {
        setConnectionError(error.message);
        setIsConnected(false);
        return false;
      }
      
      // Connection successful
      setSupabase(client);
      setSupabaseUrl(url);
      setSupabaseKey(key);
      setIsConnected(true);
      
      // Fetch initial data
      await fetchDocuments(client);
      await fetchDocumentTypes(client);
      
      return true;
    } catch (err) {
      console.error('Error connecting to Supabase:', err);
      setConnectionError(err.message);
      setIsConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect from Supabase
  const disconnectFromSupabase = () => {
    setSupabase(null);
    setIsConnected(false);
    setDocuments([]);
    setDocumentTypes([]);
  };

  // Fetch all documents from the database
  const fetchDocuments = React.useCallback(
    async (client = supabase, teamName = null) => {
      if (!client || !isConnected) {
        // Do not clear documents on early return
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        let query = client
          .from('document')
          .select('id, document_type, document_url, created_at, team, sha')
          .order('id', { ascending: false });
        
        // Filter by team if provided and team functionality is enabled
        if (TEAM_USE_ENABLED && teamName) {
          // Get documents that belong to the team or are global (team is null)
          // Using a more reliable approach with separate filter conditions
          query = query.or('team.eq.' + teamName + ',team.is.null');
          
          // Log the query for debugging
          // console.log(`[DEBUG] fetchDocuments: teamName=`, teamName);
          // console.log(`[DEBUG] fetchDocuments: Query filter:`, 'team.eq.' + teamName + ',team.is.null');
        } else {
          // If no team is provided or team functionality is disabled, fetch all documents
          // console.log('[DEBUG] fetchDocuments: Fetching all documents (no team filter)');
        }
        
        const { data, error } = await query;
        // console.log('[DEBUG] fetchDocuments: Supabase response:', { data, error });
        
        if (error) throw error;
        
        // DEBUG: Log stack trace and data before setting documents
        // console.log('[DEBUG] setDocuments called with:', data || []);
        // eslint-disable-next-line no-console
        // console.trace('[DEBUG] setDocuments stack trace');
        setDocuments(data || []);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err.message);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase, isConnected]
  );

  // Upload a document to Supabase storage and add record to the database
  const uploadDocument = async (file, documentType, teamName = null, isGlobal = false) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);

      // 1. Send file to parser API first
      const parserUrl = import.meta.env.VITE_PARSER_URL;
      const parserUrlXlsx = import.meta.env.VITE_PARSER_URL_XLSX;
      let documentText = '';
      const fileNameLower = file.name.toLowerCase();
      const isXlsx = fileNameLower.endsWith('.xlsx');
      let usedParserUrl = parserUrl;

      if (isXlsx && parserUrlXlsx) {
        usedParserUrl = parserUrlXlsx;
      }

      if (usedParserUrl) {
        const formData = new FormData();
        formData.append('file', file);
        let parserRes;
        try {
          parserRes = await fetch(usedParserUrl, {
            method: 'POST',
            body: formData
          });
        } catch (fetchErr) {
          throw new Error(`Failed to fetch parser API: ${fetchErr.message || fetchErr}`);
        }
        if (!parserRes.ok) {
          let errMsg = `Failed to parse document before upload (status ${parserRes.status})`;
          try {
            const errText = await parserRes.text();
            errMsg += `: ${errText}`;
          } catch {}
          throw new Error(errMsg);
        }
        let parserData;
        if (isXlsx) {
          // XLSX endpoint returns raw markdown, not JSON
          const markdown = await parserRes.text();
          // console.log('Parser API XLSX markdown response:', markdown);
          documentText = typeof markdown === 'string' ? markdown : '';
        } else {
          // Other endpoints return JSON
          parserData = await parserRes.json();
          // console.log('Parser API response:', parserData);
          if (typeof parserData.content === 'string' && parserData.content.trim()) {
            documentText = parserData.content;
          } else {
            documentText = '';
          }
        }
      }

      // 2. Check if the storage bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) throw bucketsError;
      
      // Check if the documentation bucket exists
      const documentationBucket = buckets.find(bucket => bucket.name === 'documentation');
      
      if (!documentationBucket) {
        // Create the documentation bucket if it doesn't exist
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('documentation', {
            public: true
          });
        
        if (createBucketError) {
          throw new Error(`Failed to create storage bucket: ${createBucketError.message}`);
        }
      }
      
      // 3. Create a unique file name with team name if provided and team functionality is enabled
      let fileName;
      let filePath;
      
      if (TEAM_USE_ENABLED && teamName && !isGlobal) {
        // Add team name to the file name
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.pop();
        const baseName = fileNameParts.join('.');
        fileName = `${baseName}_${teamName}.${extension}`;
        
        // Store in team-specific subfolder
        filePath = `${teamName}/${Date.now()}_${fileName}`;
      } else {
        // Global document or no team specified or team functionality is disabled
        fileName = `${Date.now()}_${file.name}`;
        filePath = fileName;
      }
      
      // 4. Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('documentation')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        if (uploadError.message.includes('extended attributes')) {
          throw new Error('Storage error: The Supabase storage bucket is not properly configured. Please check your Supabase storage settings.');
        }
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from('documentation')
        .getPublicUrl(filePath);
      
      const documentUrl = urlData.publicUrl;
      
      // Check if the document table exists
      const { error: tableCheckError } = await supabase
        .from('document')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist, create it
        // console.log('Document table does not exist, creating it...');
        
        // Create the document table
        const { error: createTableError } = await supabase.rpc('create_document_table');
        
        if (createTableError) {
          console.error('Error creating document table:', createTableError);
          
          // Even if table creation fails, we can still return success since the file was uploaded
          // console.log('File was uploaded successfully, but failed to create document record');
          return {
            id: 'temp-' + Date.now(),
            document_type: documentType,
            document_url: documentUrl,
            document_text: documentText,
            team: !TEAM_USE_ENABLED || isGlobal ? null : teamName
          };
        }
      }
      
      // 5. Insert record into the document table, including document_text and team (if enabled)
      const { data, error: insertError } = await supabase
        .from('document')
        .insert([
          { 
            document_type: documentType, 
            document_url: documentUrl, 
            document_text: documentText,
            team: !TEAM_USE_ENABLED || isGlobal ? null : teamName
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Error inserting document record:', insertError);
        
        // Even if insert fails, we can still return success since the file was uploaded
        // console.log('File was uploaded successfully, but failed to create document record');
        return {
          id: 'temp-' + Date.now(),
          document_type: documentType,
          document_url: documentUrl,
          document_text: documentText,
          team: !TEAM_USE_ENABLED || isGlobal ? null : teamName
        };
      }
      
      // Refresh the documents list
      await fetchDocuments(supabase, teamName);
      
      return data[0];
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a document from Supabase storage and remove record from the database
  const deleteDocument = async (documentId, documentUrl, teamName = null) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Extract the file path from the URL (robust for root and subfolders)
      let filePath = documentUrl;
      // Try to extract after '/object/public/documentation/'
      const splitToken = '/object/public/documentation/';
      if (documentUrl.includes(splitToken)) {
        filePath = documentUrl.split(splitToken)[1];
      } else {
        // fallback: try after last slash (root)
        filePath = documentUrl.split('/').pop();
      }
      // Decode URI component to match actual storage file name
      filePath = decodeURIComponent(filePath);

      // Delete the file from Supabase Storage
      const { error: deleteFileError } = await supabase
        .storage
        .from('documentation')
        .remove([filePath]);

      if (deleteFileError) throw deleteFileError;

      // Delete the record from the document table
      const { error: deleteRecordError } = await supabase
        .from('document')
        .delete()
        .eq('id', documentId);
      
      if (deleteRecordError) throw deleteRecordError;
      
      // Refresh the documents list with the current team filter
      await fetchDocuments(supabase, teamName);
      
      return true;
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all document types from the database
  const fetchDocumentTypes = React.useCallback(
    async (client = supabase) => {
      if (!client || !isConnected) {
        // console.log('fetchDocumentTypes: No client or not connected');
        setDocumentTypes([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // console.log('fetchDocumentTypes: Fetching document types...');
        
        const { data, error } = await client
          .from('document_type')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('fetchDocumentTypes: Error fetching document types:', error);
          throw error;
        }
        
        // console.log('fetchDocumentTypes: Document types fetched:', data);
        setDocumentTypes(data || []);
      } catch (err) {
        console.error('Error fetching document types:', err);
        setError(err.message);
        setDocumentTypes([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase, isConnected]
  );

  // Add a new document type
  const addDocumentType = async (name, category = 'general') => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('document_type')
        .insert([{ name, category }])
        .select();
      
      if (error) throw error;
      
      // Refresh document types
      await fetchDocumentTypes();
      
      return data[0];
    } catch (err) {
      console.error('Error adding document type:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a document type
  const deleteDocumentType = async (id) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('document_type')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh document types
      await fetchDocumentTypes();
      
      return true;
    } catch (err) {
      console.error('Error deleting document type:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Connection state
    supabase,
    isConnected,
    connectionError,
    supabaseUrl,
    supabaseKey,
    setSupabaseUrl,
    setSupabaseKey,
    connectToSupabase,
    disconnectFromSupabase,
    
    // Document state and functions
    documents,
    documentTypes,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    
    // Document type functions
    fetchDocumentTypes,
    addDocumentType,
    deleteDocumentType
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
