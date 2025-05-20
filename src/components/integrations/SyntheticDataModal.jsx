import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  IconButton,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';

function SyntheticDataModal({ open, onClose }) {
  const PARSER_URL = import.meta.env.VITE_PARSER_URL || '';
  const SYNTHETIC_DATA_API_URL = import.meta.env.VITE_SYNTHETIC_DATA_API_URL || '';

  const [csvFile, setCsvFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedCol, setSelectedCol] = useState('');
  const [numRecords, setNumRecords] = useState('');
  const [csvError, setCsvError] = useState('');
  const [csvUploading, setCsvUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // File input ref for resetting
  const fileInputRef = React.useRef(null);

  // Handle CSV file upload and parse columns
  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Only CSV files are supported.');
      return;
    }
    setCsvError('');
    setCsvUploading(true);
    setCsvFile(file);

    // Send to parser server to get columns
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(PARSER_URL, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to parse CSV');
      const data = await res.json();
      // Assume parser returns { columns: [...] } or parse from content
      let cols = [];
      if (Array.isArray(data.columns)) {
        cols = data.columns;
      } else if (typeof data.content === 'string') {
        // Try to parse columns from first row
        const firstLine = data.content.split('\n')[0];
        cols = firstLine.split(',').map(s => s.trim());
      }
      setColumns(cols);
      setSelectedCol('');
    } catch (err) {
      setCsvError('Failed to parse CSV file.');
      setColumns([]);
      setSelectedCol('');
    } finally {
      setCsvUploading(false);
    }
  };

  // Convert JSON data to CSV
  const convertToCSV = (jsonData) => {
    if (!jsonData || !jsonData.length) return '';
    
    // Get headers from first object
    const headers = Object.keys(jsonData[0]);
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    for (const row of jsonData) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values with commas, quotes, etc.
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };
  
  // Create and trigger download
  const downloadCSV = (csvString, filename) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'synthetic_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Send button
  const handleSend = async () => {
    if (!csvFile) {
      setCsvError('Please upload a CSV file.');
      return;
    }
    if (numRecords && isNaN(Number(numRecords))) {
      setCsvError('Number of records must be a number.');
      return;
    }
    setCsvError('');
    setSending(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('input_file', csvFile);
      if (selectedCol) formData.append('target_col', selectedCol);
      if (numRecords) formData.append('num_records', numRecords);

      const response = await fetch(SYNTHETIC_DATA_API_URL, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Parse the JSON response
      const result = await response.json();
      
      // Check if the response has the expected structure
      if (result && Array.isArray(result.data)) {
        // Convert the data array to CSV
        const csvString = convertToCSV(result.data);
        
        // Trigger download
        // Format date and time for filename: YYYY-MM-DD_HH-MM-SS
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        downloadCSV(csvString, `synthetic_data_${dateStr}_${timeStr}.csv`);
        
        setSuccess(true);
        // Show success message briefly, then close the modal
        setTimeout(() => {
          handleReset();
          onClose(); // Close the modal automatically
        }, 1500);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      setCsvError(`Failed to send data: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setCsvFile(null);
    setColumns([]);
    setSelectedCol('');
    setNumRecords('');
    setCsvError('');
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle dialog close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Synthetic Data Generator</Typography>
        <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Loading overlay */}
        {sending && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10,
            borderRadius: 'inherit'
          }}>
            <CircularProgress size={60} sx={{ color: '#fff', mb: 2 }} />
            <Typography variant="body1" sx={{ color: '#fff' }}>
              Generating synthetic data...
            </Typography>
          </Box>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50' }}
          >
            Synthetic data generated and downloaded successfully!
          </Alert>
        )}
        
        {csvError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
            onClose={() => setCsvError('')}
          >
            {csvError}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
            Upload a CSV file to generate synthetic data
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={csvUploading}
            sx={{ 
              mb: 2, 
              color: '#fff', 
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {csvUploading ? 'Uploading...' : (csvFile ? csvFile.name : 'Upload CSV')}
            <input
              type="file"
              hidden
              accept=".csv"
              ref={fileInputRef}
              onChange={handleCsvUpload}
            />
          </Button>
        </Box>

        {csvFile && (
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: 'rgba(25, 118, 210, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(25, 118, 210, 0.3)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ color: '#fff' }}>
                {csvFile.name}
              </Typography>
            </Box>

            {columns.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                  Validation Column (optional)
                </Typography>
                <select
                  value={selectedCol}
                  onChange={e => setSelectedCol(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    borderRadius: 4, 
                    fontSize: 16,
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <option value="">None</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                Number of Records
              </Typography>
              <input
                type="number"
                value={numRecords}
                onChange={e => setNumRecords(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: 10, 
                  borderRadius: 4, 
                  fontSize: 16,
                  backgroundColor: '#1e1e1e',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                min="1"
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSend}
          variant="contained" 
          color="primary"
          disabled={!csvFile || !numRecords || sending}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SyntheticDataModal;
