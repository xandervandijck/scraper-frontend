import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';

function duration(start, end) {
  const ms = new Date(end || Date.now()) - new Date(start);
  if (ms < 1000) return '<1s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function Sessions() {
  const { activeWorkspace } = useWorkspace();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(() => {
    if (!activeWorkspace) return;
    client.get(`/scrape/sessions?workspaceId=${activeWorkspace.id}`)
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) {
      navigate('/workspaces');
      return;
    }
    fetchSessions();
  }, [activeWorkspace, navigate, fetchSessions]);

  // Live updates via WebSocket
  useWebSocket(token, {
    onEvent: (type) => {
      if (type === 'job_done' || type === 'progress') {
        fetchSessions();
      }
    },
  });

  const running = sessions.filter((s) => s.status === 'running');
  const finished = sessions.filter((s) => s.status !== 'running');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Scrape sessies</h1>
        <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sessie{sessions.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Laden...</div>
      ) : (
        <>
          {/* Running sessions */}
          {running.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-green-400 uppercase tracking-wider">Actief</h2>
              {running.map((s) => (
                <SessionRow key={s.id} session={s} running />
              ))}
            </div>
          )}

          {/* Finished sessions */}
          <div className="card overflow-hidden p-0">
            {finished.length === 0 ? (
              <div className="text-sm text-gray-500 py-8 text-center">Nog geen sessies</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Lijst</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Gestart</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Leads</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Dupes</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Duur</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {finished.map((s) => (
                    <tr key={s.id} className="border-b border-gray-800/50 table-row-hover">
                      <td className="px-4 py-3 text-gray-300 font-medium">{s.list_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(s.created_at).toLocaleString('nl-NL')}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">{s.leads_found ?? 0}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{s.dupes_skipped ?? 0}</td>
                      <td className="px-4 py-3 text-right text-gray-400">
                        {duration(s.created_at, s.finished_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`badge ${
                          s.status === 'done' ? 'badge-blue' :
                          s.status === 'error' ? 'badge-red' :
                          s.status === 'stopped' ? 'badge-yellow' :
                          'badge-gray'
                        }`}>
                          {s.status === 'done' ? 'Klaar' :
                           s.status === 'error' ? 'Fout' :
                           s.status === 'stopped' ? 'Gestopt' : s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SessionRow({ session, running }) {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {running && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        )}
        <div>
          <div className="text-sm font-medium text-white">{session.list_name || 'Onbekende lijst'}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Gestart {new Date(session.created_at).toLocaleString('nl-NL')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <div className="text-sm font-semibold text-white">{session.leads_found ?? 0}</div>
          <div className="text-xs text-gray-500">leads</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">{session.dupes_skipped ?? 0}</div>
          <div className="text-xs text-gray-500">dupes</div>
        </div>
        <span className="badge badge-green">Actief</span>
      </div>
    </div>
  );
}
