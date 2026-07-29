import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './Router';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectDataContext';
import { ToastProvider } from './context/ToastContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
);
