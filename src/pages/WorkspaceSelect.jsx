import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function WorkspaceSelect() {
  const { user, logout } = useAuth();
  const {
    workspaces,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    loading,
  } = useWorkspace();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  function handleSelect(ws) {
    setActiveWorkspace(ws);
    navigate("/");
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const ws = await createWorkspace(newName.trim());
      setActiveWorkspace(ws);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Aanmaken mislukt");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
              E
            </div>
            <div>
              <h1 className="text-base font-bold text-white">SUPER SCRAPER</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Uitloggen
          </button>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-1">
            Selecteer werkruimte
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Kies een werkruimte om verder te gaan
          </p>

          {loading ? (
            <div className="text-sm text-gray-500 py-4 text-center">
              Laden...
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 transition-all group"
                >
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-blue-300">
                      {ws.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Aangemaakt{" "}
                      {new Date(ws.created_at).toLocaleDateString("nl-NL")}
                    </div>
                  </div>
                  <span className="text-gray-600 group-hover:text-blue-400 text-lg">
                    ›
                  </span>
                </button>
              ))}
              {workspaces.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-2">
                  Geen werkruimten gevonden
                </p>
              )}
            </div>
          )}

          <div className="divider mb-5" />

          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Nieuwe werkruimte
          </h3>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300 mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              className="input"
              placeholder="Naam werkruimte"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary whitespace-nowrap"
              disabled={creating || !newName.trim()}
            >
              {creating ? "..." : "Aanmaken"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
