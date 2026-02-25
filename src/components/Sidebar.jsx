import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/lists', label: 'Lijsten', icon: '≡' },
  { to: '/sessions', label: 'Sessies', icon: '⏱' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { activeWorkspace, workspaces, setActiveWorkspace, fetchWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const [showWsMenu, setShowWsMenu] = useState(false);

  async function handleSwitchWorkspace() {
    await fetchWorkspaces();
    setShowWsMenu((v) => !v);
  }

  function selectWorkspace(ws) {
    setActiveWorkspace(ws);
    setShowWsMenu(false);
    navigate('/');
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r border-gray-800 bg-gray-900/60 px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-1 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
          E
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">ERP Lead Engine</div>
          <div className="text-xs text-gray-500 truncate">B2B Leads</div>
        </div>
      </div>

      {/* Workspace selector */}
      <div className="relative mb-4">
        <button
          onClick={handleSwitchWorkspace}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all text-left"
        >
          <div className="min-w-0">
            <div className="text-xs text-gray-500">Werkruimte</div>
            <div className="text-sm text-gray-200 font-medium truncate">
              {activeWorkspace?.name || 'Selecteren...'}
            </div>
          </div>
          <span className="text-gray-500 text-xs shrink-0">⇅</span>
        </button>

        {showWsMenu && workspaces.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => selectWorkspace(ws)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                  ws.id === activeWorkspace?.id ? 'text-blue-300' : 'text-gray-200'
                }`}
              >
                {ws.name}
                {ws.id === activeWorkspace?.id && <span className="ml-1 text-blue-400">✓</span>}
              </button>
            ))}
            <div className="border-t border-gray-700">
              <button
                onClick={() => { setShowWsMenu(false); navigate('/workspaces'); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700"
              >
                + Nieuwe werkruimte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 flex-1">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="mt-4 border-t border-gray-800 pt-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0"
            title="Uitloggen"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
