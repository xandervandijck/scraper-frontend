import React, { useState } from 'react';
import client from '../api/client.js';
import ScrapeProgress from './ScrapeProgress.jsx';

const SECTORS = [
  { key: 'logistiek', label: 'Logistiek & Transport' },
  { key: 'bouwmaterialen', label: 'Bouwmaterialen' },
  { key: 'voedsel_groothandel', label: 'Voedsel Groothandel' },
  { key: 'metaal_staal', label: 'Metaal & Staal' },
  { key: 'chemie', label: 'Chemie & Farma' },
  { key: 'techniek', label: 'Techniek & Industrie' },
  { key: 'schoonmaak', label: 'Schoonmaak Groothandel' },
  { key: 'papier_verpakking', label: 'Papier & Verpakking' },
];

const COUNTRIES = [
  { key: 'NL', label: 'Nederland' },
  { key: 'BE', label: 'België' },
  { key: 'DE', label: 'Duitsland' },
];

export default function ExtendListModal({ list, workspaceId, onClose, onDone }) {
  const [sectorKeys, setSectorKeys] = useState([]);
  const [countryKeys, setCountryKeys] = useState(['NL']);
  const [targetLeads, setTargetLeads] = useState(100);
  const [minScore, setMinScore] = useState(50);
  const [concurrency, setConcurrency] = useState(5);
  const [emailValidation, setEmailValidation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);

  function toggleSector(key) {
    setSectorKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleCountry(key) {
    setCountryKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleStart() {
    setError('');
    setLoading(true);
    try {
      const { data } = await client.post(`/lists/${list.id}/extend`, {
        workspaceId,
        config: {
          sectorKeys,
          countryKeys,
          targetLeads: Number(targetLeads),
          minScore: Number(minScore),
          concurrency: Number(concurrency),
          emailValidation,
        },
      });
      setSessionId(data.sessionId);
    } catch (err) {
      setError(err.response?.data?.error || 'Starten mislukt');
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    onDone?.();
    onClose();
  }

  // Show live progress after job starts
  if (sessionId) {
    return (
      <div className="modal-backdrop">
        <div className="modal max-w-2xl">
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Scrape actief — {list.name}</h2>
          </div>
          <ScrapeProgress sessionId={sessionId} workspaceId={workspaceId} onDone={handleDone} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl">
        <div className="px-6 py-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Lijst uitbreiden — {list.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Configureer en start een nieuwe scrape</p>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Sectors */}
          <div>
            <label className="label">Sectoren (leeg = alle)</label>
            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={sectorKeys.includes(key)}
                    onChange={() => toggleSector(key)}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="label">Landen</label>
            <div className="flex gap-4">
              {COUNTRIES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={countryKeys.includes(key)}
                    onChange={() => toggleCountry(key)}
                    className="rounded border-gray-600 bg-gray-800 text-blue-500"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Doel leads</label>
              <input
                className="input"
                type="number"
                min={10}
                max={2000}
                value={targetLeads}
                onChange={(e) => setTargetLeads(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Min. score</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Gelijktijdig</label>
              <input
                className="input"
                type="number"
                min={1}
                max={10}
                value={concurrency}
                onChange={(e) => setConcurrency(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailValidation}
              onChange={(e) => setEmailValidation(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-blue-500"
            />
            <span className="text-sm text-gray-300">E-mail validatie</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-ghost">Annuleren</button>
          <button
            onClick={handleStart}
            className="btn-primary"
            disabled={loading || countryKeys.length === 0}
          >
            {loading ? 'Starten...' : 'Scrape starten'}
          </button>
        </div>
      </div>
    </div>
  );
}
