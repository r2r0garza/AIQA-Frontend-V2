# Frontend Documentation for AI Quality Assistant

## Overview
This document provides a detailed overview of the frontend structure and components of the AI Quality Assistant application. It serves as a guide for replicating the frontend functionality.

## Project Structure
The frontend of the application is organized as follows:

```
frontend/
├── src/
│   ├── app/
│   │   ├── app-routing.module.ts
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   ├── query/
│   │   │   ├── query.component.ts
│   │   │   ├── query.component.html
│   │   │   ├── query.component.scss
│   │   ├── ...
```

## Key Components

### 1. AppModule (`app.module.ts`)
- **Imports**: 
  - `BrowserModule`, `IonicModule`, `MarkdownModule`, `FormsModule`, `HttpClientModule`.
- **Declarations**: 
  - `AppComponent`.
- **Providers**: 
  - `AuthGuard`, `AuthService`.

### 2. AppComponent (`app.component.ts`)
- **Template**: 
  - Contains the main application structure with `<ion-router-outlet>` for routing.
- **Properties**: 
  - `title`: The title of the application.

### 3. AppRoutingModule (`app-routing.module.ts`)
- **Routes**: 
  - Maps the root path to the `QueryComponent`.

### 4. QueryComponent (`query.component.ts`)
- **Imports**: 
  - Various Angular and Ionic modules, including `CommonModule`, `FormsModule`, and third-party libraries.
- **Properties**: 
  - Manages state for user queries, responses, and configurations for external services (Jira, ADO, AWS).
- **Methods**: 
  - Handles user interactions, file uploads, and API requests.

### 5. QueryComponent Template (`query.component.html`)
- **Sidebar**: 
  - Contains buttons for selecting AI assistants and file uploads.
- **Main Content**: 
  - Displays chat messages, user input, and response metrics.
- **Right Sidebar**: 
  - Connects to external services and shows loading indicators.

## Functionality
- The application allows users to interact with various AI assistants for generating user stories, acceptance criteria, test cases, and more.
- Users can upload files, view responses, and connect to external services like Jira and ADO.

## Setup Instructions
1. **Install Dependencies**: Ensure all required dependencies are listed in `package.json`.
2. **Run the Application**: Use the command `npm run dev` to start the application.

## Conclusion
This document outlines the structure and functionality of the AI Quality Assistant frontend. It serves as a comprehensive guide for replicating the application.
