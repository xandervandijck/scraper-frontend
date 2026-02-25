import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export default function Layout() {
  const { activeWorkspace, fetchWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  // Load workspaces if needed, redirect if none selected
  useEffect(() => {
    fetchWorkspaces().then((list) => {
      if (!activeWorkspace && list?.length > 0) {
        // Auto-select first workspace
      }
      if (!activeWorkspace) {
        navigate('/workspaces');
      }
    });
  }, []); // only on mount

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
