import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import client from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('activeWorkspace'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return [];
    setLoading(true);
    try {
      const { data } = await client.get('/workspaces');
      setWorkspaces(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const setActiveWorkspace = useCallback((ws) => {
    setActiveWorkspaceState(ws);
    if (ws) {
      localStorage.setItem('activeWorkspace', JSON.stringify(ws));
    } else {
      localStorage.removeItem('activeWorkspace');
    }
  }, []);

  const createWorkspace = useCallback(async (name) => {
    const { data } = await client.post('/workspaces', { name });
    setWorkspaces((prev) => [...prev, data]);
    return data;
  }, []);

  // If authenticated but no active workspace, try to restore from stored list
  useEffect(() => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    }
  }, [isAuthenticated]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        fetchWorkspaces,
        setActiveWorkspace,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
