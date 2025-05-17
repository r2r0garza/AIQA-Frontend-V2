/**
 * Utility functions for parsing and formatting document content
 */

/**
 * Parses a DOCX file content and formats it for display
 * @param {string} content - The raw content from a DOCX file
 * @returns {string} Formatted content in markdown format
 */
export const parseDocxContent = (content) => {
  // Check if content is available
  if (!content) return '';

  try {
    // Format the document structure
    let formattedContent = content;

    // Preserve document title with equals signs
    formattedContent = formattedContent.replace(
      /^([A-Z][\w\s-]+):\s*([\r\n]+)=+/gm,
      '# $1\n'
    );

    // Remove standalone equals and dash lines (used as underlines in docx)
    formattedContent = formattedContent
      .replace(/^=+$/gm, '')
      .replace(/^-+$/gm, '');

    // Format main sections with colons
    formattedContent = formattedContent
      .replace(/^([A-Za-z][\w\s-]+):\s*$/gm, '## $1\n');

    // Format lists (numbered and bulleted)
    formattedContent = formattedContent
      .replace(/^\s*(\d+)\.\s+(.+)$/gm, '1. $2')
      .replace(/^\s*-\s+(.+)$/gm, '- $1');

    // Format indented sections (like in "Non-Functional Requirements")
    formattedContent = formattedContent
      .replace(/^\s{4}([A-Za-z][\w\s-]+):\s*(.+)$/gm, '### $1\n$2');

    // Format warnings, notes, and suggestions sections
    formattedContent = formattedContent
      .replace(/^(Warnings|Notes|Suggestions for improvement):\s*$/gm, '## $1\n');

    // Preserve indentation for nested content
    formattedContent = formattedContent
      .replace(/^\s{4}([^#\s].+)$/gm, '   $1');

    // Format description/measurement/target lines in non-functional requirements
    formattedContent = formattedContent
      .replace(/^\s*(Description|Measurement|Target|Standard|Validation):\s*(.+)$/gm, '**$1:** $2');

    // Clean up extra newlines but preserve document structure
    formattedContent = formattedContent
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return formattedContent;
  } catch (error) {
    console.error('Error parsing DOCX content:', error);
    return content; // Return original content if parsing fails
  }
};

/**
 * Extracts the title from document content
 * @param {string} content - The document content
 * @returns {string} The document title
 */
export const extractDocumentTitle = (content) => {
  if (!content) return 'Untitled Document';
  
  // Try to find the first heading
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1];
  }
  
  // If no heading found, use the first line
  const firstLine = content.split('\n')[0].trim();
  if (firstLine) {
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }
  
  return 'Untitled Document';
};

/**
 * Extracts the document type from the content
 * @param {string} content - The document content
 * @returns {string} The document type
 */
export const detectDocumentType = (content) => {
  if (!content) return 'General Documentation';
  
  const contentLower = content.toLowerCase();
  
  // Check for specific document types
  if (contentLower.includes('user story') || contentLower.includes('as a user')) {
    return 'User Story Creator Template';
  }
  
  if (contentLower.includes('acceptance criteria') || contentLower.includes('given') && contentLower.includes('when') && contentLower.includes('then')) {
    return 'Acceptance Criteria Creator Template';
  }
  
  if (contentLower.includes('test case') || contentLower.includes('expected result')) {
    return 'Test Cases Generator Template';
  }
  
  if (contentLower.includes('automation script') || contentLower.includes('selenium') || contentLower.includes('pytest')) {
    return 'Automation Script Generator Template';
  }
  
  if (contentLower.includes('test data') || contentLower.includes('test dataset')) {
    return 'Test Data Generator Template';
  }
  
  if (contentLower.includes('hipaa')) {
    return 'HIPAA Documentation';
  }
  
  if (contentLower.includes('istqb')) {
    return 'ISTQB Documentation';
  }
  
  if (contentLower.includes('project guidelines') || contentLower.includes('project standard')) {
    return 'Project Guidelines';
  }
  
  // Default to general documentation
  return 'General Documentation';
};
