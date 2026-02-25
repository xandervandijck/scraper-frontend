import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/lists': 'Lead lijsten',
  '/sessions': 'Scrape sessies',
};

export default function Header() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Match /lists/:id/leads
  const isLeadsPage = /^\/lists\/.+\/leads/.test(location.pathname);
  const title = isLeadsPage ? 'Leads' : (PAGE_TITLES[location.pathname] || 'ERP Lead Engine');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
      >
        Uitloggen
      </button>
    </header>
  );
}
