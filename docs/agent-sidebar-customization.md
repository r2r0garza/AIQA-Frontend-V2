# Agent Sidebar Customization Guide

This guide explains how to customize the agent sidebar by adding new agents or hiding existing ones.

## How to Hide an Existing Agent

To hide an agent from the sidebar without removing it from the codebase:

1. Open the `src/constants.js` file
2. Find the `AGENTS` array
3. Either:
   - Remove the agent object from the array
   - Add a `hidden: true` property to the agent object

### Example: Adding a hidden property

```javascript
// List of available agents
export const AGENTS = [
  { id: 'user-story-creator', name: 'User Story Creator', file: null },
  { id: 'acceptance-criteria-creator', name: 'Acceptance Criteria Creator', file: null, hidden: true }, // This agent will be hidden
  { id: 'test-cases-generator', name: 'Test Cases Generator', file: null },
  { id: 'automation-script-generator', name: 'Automation Script Generator', file: null },
  { id: 'test-data-generator', name: 'Test Data Generator', file: null },
  { id: 'language-detector', name: 'Language Detector', file: null }
];
```

Then, update the `AgentSidebar.jsx` file to filter out hidden agents:

```javascript
// In AgentSidebar.jsx, modify the List rendering:
<List sx={{ p: 0 }}>
  {agents.filter(agent => !agent.hidden).map((agent) => (
    <ListItem key={agent.id} disablePadding sx={{ mb: 2 }}>
      {/* Rest of the code remains the same */}
    </ListItem>
  ))}
</List>
```

## How to Add a New Agent

To add a new agent to the sidebar:

1. Open the `src/constants.js` file
2. Add a new object to the `AGENTS` array with the required properties:
   - `id`: A unique identifier for the agent (used in webhook URLs)
   - `name`: The display name shown in the sidebar
   - `file`: Initially set to `null`

### Example: Adding a new agent

```javascript
// List of available agents
export const AGENTS = [
  { id: 'user-story-creator', name: 'User Story Creator', file: null },
  { id: 'acceptance-criteria-creator', name: 'Acceptance Criteria Creator', file: null },
  { id: 'test-cases-generator', name: 'Test Cases Generator', file: null },
  { id: 'automation-script-generator', name: 'Automation Script Generator', file: null },
  { id: 'test-data-generator', name: 'Test Data Generator', file: null },
  { id: 'language-detector', name: 'Language Detector', file: null },
  { id: 'my-new-agent', name: 'My Custom Agent', file: null } // New agent added here
];
```

## Adding a Webhook URL for a New Agent

After adding a new agent, you'll need to configure its webhook URL:

1. Open the `.env` file
2. Add a new environment variable for your agent's webhook URL:
   ```
   VITE_MY_NEW_AGENT_WEBHOOK_URL=https://your-webhook-url.com
   ```

3. Update the `getWebhookUrl` function in `App.jsx` to include your new agent:

```javascript
// Get webhook URL for the selected agent
const getWebhookUrl = (agentId) => {
  const webhookMap = {
    'user-story-creator': import.meta.env.VITE_USER_STORY_CREATOR_WEBHOOK_URL,
    'acceptance-criteria-creator': import.meta.env.VITE_ACCEPTANCE_CRITERIA_CREATOR_WEBHOOK_URL,
    'test-cases-generator': import.meta.env.VITE_TEST_CASES_GENERATOR_WEBHOOK_URL,
    'automation-script-generator': import.meta.env.VITE_AUTOMATION_SCRIPT_GENERATOR_WEBHOOK_URL,
    'test-data-generator': import.meta.env.VITE_TEST_DATA_GENERATOR_WEBHOOK_URL,
    'language-detector': import.meta.env.VITE_LANGUAGE_DETECTOR_WEBHOOK_URL,
    'my-new-agent': import.meta.env.VITE_MY_NEW_AGENT_WEBHOOK_URL // Add your new agent here
  };
  
  return webhookMap[agentId];
};
```

## Adding Custom Simulated Responses (Optional)

If you want to add simulated responses for your new agent when the webhook is unavailable:

1. Find the `generateSimulatedResponse` function in `App.jsx`
2. Add a new case for your agent:

```javascript
// Function to generate simulated responses for demo purposes
const generateSimulatedResponse = (agentId, message) => {
  const currentDate = new Date().toLocaleDateString();
  
  switch (agentId) {
    // Existing cases...
    
    case 'my-new-agent':
      return `## Custom Response\n\nThis is a simulated response from your custom agent for: "${message}"\n\n**Generated on:** ${currentDate}`;
      
    default:
      return `I've processed your request: "${message}"\n\nThis is a simulated response for demonstration purposes. In a real implementation, this would connect to the actual AI service.`;
  }
};
```

## Advanced Customization

### Customizing Agent Properties

You can add additional properties to your agent objects:

```javascript
{ 
  id: 'custom-agent', 
  name: 'Custom Agent', 
  file: null,
  icon: 'CustomIcon', // If you want to add custom icons
  description: 'This agent does something special', // For tooltips or descriptions
  maxFileSize: 5000000 // Custom file size limits
}
```

Then update the `AgentSidebar.jsx` component to use these properties as needed.

### Adjusting the Background Image Dimming

The tech background image at the bottom of the sidebar has a configurable dimming effect. You can adjust how dim the image appears by changing the `IMAGE_DIM_PERCENTAGE` constant at the top of the `AgentSidebar.jsx` file:

```javascript
// Image dimming percentage - adjust this value to control the image brightness
// 0% = no dimming (full brightness), 100% = completely dark
const IMAGE_DIM_PERCENTAGE = 10; // Currently set to 10% dimming
```

- Setting this to `0` will show the image at full brightness
- Setting this to `100` will make the image completely black (invisible)
- Values in between will proportionally dim the image

This allows you to fine-tune the appearance of the background image for each client installation.
