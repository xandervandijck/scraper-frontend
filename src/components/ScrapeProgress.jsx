import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import client from '../api/client.js';

export default function ScrapeProgress({ sessionId, workspaceId, onDone }) {
  const { token } = useAuth();
  const [progress, setProgress] = useState({ leadsFound: 0, dupes: 0, processed: 0, total: 0, percent: 0 });
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(false);
  const [stopped, setStopped] = useState(false);
  const logEndRef = useRef(null);

  useWebSocket(token, {
    onEvent: (type, payload) => {
      if (type === 'progress' && payload?.workspaceId === workspaceId) {
        setProgress((p) => ({
          ...p,
          leadsFound: payload.leadsFound ?? p.leadsFound,
          dupes: payload.dupes ?? p.dupes,
          processed: payload.processed ?? p.processed,
          total: payload.total ?? p.total,
          percent: payload.percent ?? p.percent,
        }));
      }
      if (type === 'lead') {
        setProgress((p) => ({ ...p, leadsFound: p.leadsFound + 1 }));
      }
      if (type === 'log') {
        setLogs((prev) => [...prev.slice(-199), payload]);
      }
      if (type === 'job_done' && payload?.workspaceId === workspaceId) {
        setDone(true);
        setProgress((p) => ({
          ...p,
          leadsFound: payload.leadsFound ?? p.leadsFound,
          percent: 100,
        }));
      }
    },
  });

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function handleStop() {
    try {
      await client.post('/scrape/stop', { workspaceId });
      setStopped(true);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col">
      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-800">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{progress.leadsFound}</div>
          <div className="text-xs text-gray-500">Leads gevonden</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-400">{progress.dupes}</div>
          <div className="text-xs text-gray-500">Dupes overgeslagen</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-300">{progress.processed}</div>
          <div className="text-xs text-gray-500">Sites verwerkt</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 border-b border-gray-800">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{done ? 'Voltooid' : stopped ? 'Gestopt' : 'Bezig...'}</span>
          <span>{progress.percent ?? 0}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : stopped ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'}`}
            style={{ width: `${Math.min(100, progress.percent ?? 0)}%` }}
          />
        </div>
      </div>

      {/* Log stream */}
      <div className="px-6 py-3 border-b border-gray-800">
        <div className="text-xs text-gray-500 mb-2">Log</div>
        <div className="bg-gray-950 rounded-lg p-3 h-36 overflow-y-auto font-mono text-xs">
          {logs.length === 0 && (
            <div className="text-gray-600">Wachten op logs...</div>
          )}
          {logs.map((entry, i) => (
            <div
              key={i}
              className={`leading-5 ${
                entry.level === 'error' ? 'text-red-400' :
                entry.level === 'warn' ? 'text-yellow-400' :
                entry.level === 'success' ? 'text-green-400' :
                'text-gray-400'
              }`}
            >
              <span className="text-gray-600">[{entry.level?.toUpperCase() ?? 'LOG'}]</span>{' '}
              {entry.message ?? JSON.stringify(entry)}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex gap-3 justify-end">
        {!done && !stopped ? (
          <button onClick={handleStop} className="btn-danger">
            Stoppen
          </button>
        ) : (
          <button onClick={onDone} className="btn-primary">
            Sluiten
          </button>
        )}
      </div>
    </div>
  );
}
