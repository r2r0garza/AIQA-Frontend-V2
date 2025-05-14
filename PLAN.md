# Implementation Plan (PLAN.md)
## AI Quality Assistant Frontend (Vite + React)

---

## Phase 1: Project Setup & Core UI

### 1.1 Initialize Project
- ✅ Set up Vite + React project.
- Configure TypeScript (optional, but recommended).
- ✅ Set up project structure: `src/`, `components/`, `assets/`, etc.
- ✅ Add environment file support for webhook URLs and service endpoints.

### 1.2 Install Dependencies
- ✅ React, ReactDOM
- ✅ UI library (Material UI)
- **Do not use TailwindCSS for any part of the project.**
- ✅ Markdown renderer (react-markdown)
- ✅ File upload support (native or with helper library)
- ✅ HTTP client (axios)

### 1.3 Main Layout
- ✅ Implement main layout with:
  - ✅ Left sidebar (agent selection) that can be hidden or shown with an arrow button.
  - ✅ Central chat area
  - ✅ Right sidebar (external services) that can be hidden or shown with an arrow button.
- ✅ Add responsive design and basic theming.

---

## Phase 2: Agent Selection & AI Response

### 2.1 Agent Selection Sidebar
- ✅ List available AI agents.
- ✅ Allow user to select an agent (highlight selection).
- ✅ Store selected agent in state.
- ✅ Sidebar can be hidden or shown with an arrow button.
- ✅ When the agent is changed, clear the main div (AI response area).

### 2.2 AI Response Display
- ✅ Main div displays only the AI's answer to the most recent user request.
- ✅ No chat history is shown; only the latest AI response is visible.
- ✅ Input box for user message.
- ✅ "Go" button to send message.
- ✅ Support Markdown rendering in the AI response.

### 2.3 File Upload
- ✅ Add file upload input to each agent.
- ✅ Allow user to attach a file to an agent.
- ✅ Show file name and allow removal before sending.

### 2.4 Webhook Integration
- ✅ On "Go", send message and file to n8n webhook (URL from env file) using multipart/form-data POST.
- ✅ Handle success and error responses.
- ✅ Show loading indicator while sending.

### 2.5 Response Utilities
- Add a "Copy to Clipboard" button for the AI's response.
- Allow users to easily copy the entire response or selected portions.
- Show visual feedback when content is copied.

---

## Phase 3: External Service Integrations

### 3.1 Jira Integration
- UI for entering Jira credentials/config.
- Connect/disconnect logic.
- Show connection status.
- (Stub or implement basic API calls as needed.)

### 3.2 Azure DevOps (ADO) Integration
- UI for entering ADO credentials/config.
- Connect/disconnect logic.
- Show connection status.
- (Stub or implement basic API calls as needed.)

### 3.3 AWS Integration
- UI for entering AWS credentials/config.
- Connect/disconnect logic.
- Show connection status.
- (Stub or implement basic API calls as needed.)

### 3.4 Service State Management
- Store connection state for each service.
- ✅ Right sidebar can be hidden or shown with an arrow button.
- Display loading indicators and error messages.

---

## Phase 4: Branding & Theming

### 4.1 Integrate Branding Assets
- ✅ Add provided logos and color schemes to assets folder.
- ✅ Update UI components to use branding.

### 4.2 Theming Support
- Implement light/dark mode toggle (optional).
- Ensure all components use theme variables.

---

## Phase 5: Polish & QA

### 5.1 Responsive Design
- Test and adjust layout for desktop, tablet, and mobile.

### 5.2 Accessibility
- Add ARIA labels, keyboard navigation, and ensure color contrast.

### 5.3 Code Cleanup & Documentation
- Refactor code for clarity and maintainability.
- Add comments and documentation.

### 5.4 Manual QA & Bugfixes
- Test all features and integrations.
- Fix any discovered issues.

---

## Deliverables

- Fully functional frontend matching PRD requirements.
- All code, assets, and documentation in the repository.
- Ready for branding assets and endpoint configuration.
