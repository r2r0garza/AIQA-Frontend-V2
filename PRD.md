# Product Requirements Document (PRD)
## AI Quality Assistant Frontend (Vite + React)

### Overview
Replicate the AI Quality Assistant frontend using Vite and React, matching the original structure and features, but with modern best practices and a focus on modularity, maintainability, and extensibility.

---

### Core Features

#### 1. Agent Selection
- Sidebar for choosing between multiple AI assistants ("agents").
- Sidebar can be hidden or shown with an arrow button.
- Each agent is visually distinct and selectable.

#### 2. AI Response Display
- Main div displays only the AI's answer to the most recent user request.
- No chat history is shown; only the latest AI response is visible.
- When the user changes agents using the sidebar, the main div is cleared.
- User can send a message and receive a single response.
- Support for Markdown rendering in the AI response.
- File upload: user can attach a file to a message.
- When "Go" is clicked, the message and file are sent to an n8n webhook (URL from environment file) using a multipart/form-data POST request.

#### 3. External Service Integrations
- Right sidebar for connecting/configuring external services:
  - Sidebar can be hidden or shown with an arrow button.
  - Jira
  - Azure DevOps (ADO)
  - AWS
- UI for entering credentials/config, connecting, and showing connection status.
- Functional integration: allow users to connect and interact with these services as in the original app.

#### 4. Branding & Theming
- Support for custom logos and color schemes (assets to be provided).
- All UI components should reflect branding requirements.

#### 5. Environment Configuration
- All external URLs (n8n webhook, service endpoints) are set via an environment file.
- No hardcoded endpoints.

#### 6. No Authentication/User Management
- No login, registration, or user management required.

---

### Non-Functional Requirements

- Responsive design for desktop and mobile.
- Accessibility best practices (ARIA, keyboard navigation, color contrast).
- Clean, maintainable, and well-documented codebase.
- Easy to extend for future integrations or features.

---

### Constraints

- Do not use TailwindCSS for any part of the project.

---

### Out of Scope

- Backend logic (handled by n8n and external services).
- User authentication/authorization.
- Magic links, social login, or SSO.

---

### Success Criteria

- All features above are implemented and functional.
- Main div only displays the latest AI response, with no chat history.
- Main div is cleared when the agent is changed.
- UI matches provided branding.
- File upload and webhook integration work reliably.
- External service integrations are functional and user-friendly.
- Codebase is easy to maintain and extend.
