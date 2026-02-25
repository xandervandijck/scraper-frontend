import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import WorkspaceSelect from './pages/WorkspaceSelect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Lists from './pages/Lists.jsx';
import Leads from './pages/Leads.jsx';
import Sessions from './pages/Sessions.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected — workspace selector */}
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute>
                  <WorkspaceSelect />
                </ProtectedRoute>
              }
            />

            {/* Protected — app pages with Layout shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="lists" element={<Lists />} />
              <Route path="lists/:id/leads" element={<Leads />} />
              <Route path="sessions" element={<Sessions />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
