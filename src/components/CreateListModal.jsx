import React, { useState } from 'react';
import client from '../api/client.js';

export default function CreateListModal({ workspaceId, onCreated, onClose }) {
  const [name, setName] = useState('');
  const [targetLeads, setTargetLeads] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/lists', {
        workspaceId,
        name: name.trim(),
        targetLeads: Number(targetLeads),
      });
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Aanmaken mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="px-6 py-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Nieuwe lijst aanmaken</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="label">Naam</label>
              <input
                className="input"
                placeholder="bijv. NL Logistiek Q1 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Doel aantal leads</label>
              <input
                className="input"
                type="number"
                min={10}
                max={5000}
                value={targetLeads}
                onChange={(e) => setTargetLeads(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1.5">Wordt gebruikt voor de voortgangsbalk</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">Annuleren</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Aanmaken...' : 'Lijst aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
