import React from 'react';
import { List, ListItem, ListItemButton, Box, Tooltip, ListItemText } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';

function DocumentCategorySidebar({ documentCategories, selectedCategory, onSelectCategory }) {
  return (
    <List sx={{ width: '100%', p: 0 }}>
      {documentCategories.map((category) => (
        <ListItem key={category.id} disablePadding>
          <ListItemButton 
            onClick={() => onSelectCategory(category)}
            selected={selectedCategory?.id === category.id}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.3)',
                }
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <Box sx={{ mr: 2 }}>
              {category.icon || (category.type === 'general'
                ? <FolderIcon sx={{ color: '#4caf50' }} />
                : <DescriptionIcon sx={{ color: 'primary.main' }} />)}
            </Box>
            <Tooltip title={category.name}>
              <ListItemText 
                primary={category.name} 
                primaryTypographyProps={{ 
                  sx: { 
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  } 
                }}
              />
            </Tooltip>
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

export default DocumentCategorySidebar;
