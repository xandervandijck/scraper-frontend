import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';

export default function Dashboard() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) {
      navigate('/workspaces');
      return;
    }
    Promise.all([
      client.get(`/lists?workspaceId=${activeWorkspace.id}`),
      client.get(`/scrape/sessions?workspaceId=${activeWorkspace.id}`),
    ])
      .then(([listsRes, sessionsRes]) => {
        setLists(listsRes.data);
        setSessions(sessionsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace, navigate]);

  const totalLeads = lists.reduce((sum, l) => sum + (l.lead_count || 0), 0);
  const activeSession = sessions.find((s) => s.status === 'running');
  const lastSession = sessions[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-gray-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-value">{totalLeads.toLocaleString('nl-NL')}</div>
          <div className="stat-label">Totaal leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{lists.length}</div>
          <div className="stat-label">Lijsten</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-label">Sessies</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value text-base ${activeSession ? 'text-green-400' : 'text-gray-500'}`}>
            {activeSession ? 'Actief' : lastSession ? new Date(lastSession.created_at).toLocaleDateString('nl-NL') : '—'}
          </div>
          <div className="stat-label">{activeSession ? 'Scrape loopt' : 'Laatste activiteit'}</div>
        </div>
      </div>

      {/* Recent lists */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recente lijsten</h2>
          <Link to="/lists" className="text-xs text-blue-400 hover:text-blue-300">
            Alle lijsten →
          </Link>
        </div>
        {lists.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">
            Nog geen lijsten.{' '}
            <Link to="/lists" className="text-blue-400 hover:text-blue-300">
              Maak je eerste lijst aan.
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {lists.slice(0, 5).map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}/leads`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <div>
                  <div className="text-sm font-medium text-gray-200 group-hover:text-white">{list.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Doel: {list.target_leads} leads
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{list.lead_count || 0}</div>
                  <div className="text-xs text-gray-500">leads</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recente sessies</h2>
          <Link to="/sessions" className="text-xs text-blue-400 hover:text-blue-300">
            Alle sessies →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">Nog geen sessies</div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50">
                <div>
                  <div className="text-sm text-gray-300">{s.list_name || 'Onbekende lijst'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.created_at).toLocaleString('nl-NL')}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${s.status === 'running' ? 'badge-green' : s.status === 'done' ? 'badge-blue' : 'badge-gray'}`}>
                    {s.status === 'running' ? 'Actief' : s.status === 'done' ? 'Klaar' : s.status}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{s.leads_found || 0} leads</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
