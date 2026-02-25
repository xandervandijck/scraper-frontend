import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import CreateListModal from '../components/CreateListModal.jsx';

export default function Lists() {
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchLists = useCallback(() => {
    if (!activeWorkspace) return;
    client.get(`/lists?workspaceId=${activeWorkspace.id}`)
      .then((res) => setLists(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) {
      navigate('/workspaces');
      return;
    }
    fetchLists();
  }, [activeWorkspace, navigate, fetchLists]);

  function handleCreated(list) {
    setLists((prev) => [list, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Lead lijsten</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lists.length} lijst{lists.length !== 1 ? 'en' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Nieuwe lijst
        </button>
      </div>

      {/* Lists */}
      {loading ? (
        <div className="text-sm text-gray-500 py-8 text-center">Laden...</div>
      ) : lists.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-500 mb-4 text-sm">Je hebt nog geen lijsten</div>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
            Maak eerste lijst
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => {
            const progress = list.target_leads > 0
              ? Math.min(100, Math.round(((list.lead_count || 0) / list.target_leads) * 100))
              : 0;

            return (
              <div key={list.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/lists/${list.id}/leads`}
                    className="text-sm font-semibold text-white hover:text-blue-300 transition-colors line-clamp-2"
                  >
                    {list.name}
                  </Link>
                  <span className="badge badge-gray shrink-0">
                    {new Date(list.created_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{list.lead_count || 0} leads</span>
                    <span>Doel: {list.target_leads}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{progress}% voltooid</div>
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  <Link
                    to={`/lists/${list.id}/leads`}
                    className="btn-ghost btn-sm flex-1 text-center"
                  >
                    Bekijken
                  </Link>
                  <Link
                    to={`/lists/${list.id}/leads`}
                    className="btn-primary btn-sm flex-1 text-center"
                  >
                    Scrapen →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateListModal
          workspaceId={activeWorkspace?.id}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

    </div>
  );
}
