import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create context
const SupabaseContext = createContext();

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
    async (client = supabase) => {
      if (!client || !isConnected) {
        setDocuments([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await client
          .from('document')
          .select('*')
          .order('id', { ascending: false });
        
        if (error) throw error;
        
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
  const uploadDocument = async (file, documentType) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if the storage bucket exists
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
      
      // Create a unique file name
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('documentation')
        .upload(fileName, file, {
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
        .getPublicUrl(fileName);
      
      const documentUrl = urlData.publicUrl;
      
      // Check if the document table exists
      const { error: tableCheckError } = await supabase
        .from('document')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist, create it
        console.log('Document table does not exist, creating it...');
        
        // Create the document table
        const { error: createTableError } = await supabase.rpc('create_document_table');
        
        if (createTableError) {
          console.error('Error creating document table:', createTableError);
          
          // Even if table creation fails, we can still return success since the file was uploaded
          console.log('File was uploaded successfully, but failed to create document record');
          return {
            id: 'temp-' + Date.now(),
            document_type: documentType,
            document_url: documentUrl
          };
        }
      }
      
      // Insert record into the document table
      const { data, error: insertError } = await supabase
        .from('document')
        .insert([
          { document_type: documentType, document_url: documentUrl }
        ])
        .select();
      
      if (insertError) {
        console.error('Error inserting document record:', insertError);
        
        // Even if insert fails, we can still return success since the file was uploaded
        console.log('File was uploaded successfully, but failed to create document record');
        return {
          id: 'temp-' + Date.now(),
          document_type: documentType,
          document_url: documentUrl
        };
      }
      
      // Refresh the documents list
      await fetchDocuments();
      
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
  const deleteDocument = async (documentId, documentUrl) => {
    if (!supabase || !isConnected) {
      setError('Not connected to Supabase');
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Extract the file name from the URL
      const fileName = documentUrl.split('/').pop();
      
      // Delete the file from Supabase Storage
      const { error: deleteFileError } = await supabase
        .storage
        .from('documentation')
        .remove([fileName]);
      
      if (deleteFileError) throw deleteFileError;
      
      // Delete the record from the document table
      const { error: deleteRecordError } = await supabase
        .from('document')
        .delete()
        .eq('id', documentId);
      
      if (deleteRecordError) throw deleteRecordError;
      
      // Refresh the documents list
      await fetchDocuments();
      
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
        console.log('fetchDocumentTypes: No client or not connected');
        setDocumentTypes([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('fetchDocumentTypes: Fetching document types...');
        
        const { data, error } = await client
          .from('document_type')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('fetchDocumentTypes: Error fetching document types:', error);
          throw error;
        }
        
        console.log('fetchDocumentTypes: Document types fetched:', data);
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
