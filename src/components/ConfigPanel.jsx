import React, { useState } from 'react';

const COUNTRIES = [
  { key: 'NL', label: '🇳🇱 Nederland' },
  { key: 'BE', label: '🇧🇪 België' },
  { key: 'DE', label: '🇩🇪 Duitsland' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <label className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={onChange} />
      <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-700'}`} />
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </label>
  );
}

export default function ConfigPanel({ config, onChange, disabled, sectors, onSectorsChange }) {
  const [editingSectors, setEditingSectors] = useState(false);
  const [newSector, setNewSector] = useState({ key: '', label: '', queries: '' });
  const [sectorError, setSectorError] = useState('');

  const toggle = (field, value) => {
    const current = config[field] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...config, [field]: next });
  };

  const allSectors = !config.sectorKeys?.length;
  const allCountries = !config.countryKeys?.length;

  // Sector management
  const handleAddSector = () => {
    setSectorError('');
    const key = newSector.key.trim().replace(/\s+/g, '_').toLowerCase();
    const label = newSector.label.trim();
    const queries = newSector.queries.split('\n').map((q) => q.trim()).filter(Boolean);

    if (!key || !label || !queries.length) {
      setSectorError('Vul key, naam en minimaal 1 query in.');
      return;
    }
    if (sectors.some((s) => s.key === key)) {
      setSectorError(`Sector key "${key}" bestaat al.`);
      return;
    }

    onSectorsChange([...sectors, { key, label, queries }]);
    setNewSector({ key: '', label: '', queries: '' });
  };

  const handleRemoveSector = (key) => {
    onSectorsChange(sectors.filter((s) => s.key !== key));
    onChange({ ...config, sectorKeys: (config.sectorKeys ?? []).filter((k) => k !== key) });
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        <span className="text-blue-400">⚙</span> Configuratie
      </h2>

      {/* Target leads */}
      <div>
        <label className="label">Doel: leads</label>
        <input
          type="number"
          className="input"
          min={10}
          max={5000}
          step={50}
          value={config.targetLeads}
          onChange={(e) => onChange({ ...config, targetLeads: parseInt(e.target.value) || 100 })}
          disabled={disabled}
        />
      </div>

      {/* Search source */}
      <div className="bg-gray-800/50 rounded-lg px-4 py-3 border border-gray-700 space-y-3">
        <label className="label mb-0">Zoekmethode</label>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Puppeteer (Headless Chrome)</p>
            <p className="text-xs text-gray-500">Echte browser — betrouwbaarder, langzamer start</p>
          </div>
          <Toggle
            checked={config.usePuppeteer !== false}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, usePuppeteer: e.target.checked })}
          />
        </div>

        {config.usePuppeteer === false && (
          <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded px-2 py-1.5">
            ⚠ HTTP fallback actief — kan 0 resultaten geven als DDG blokkeert
          </div>
        )}
      </div>

      {/* Sectors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">
            Sectoren {allSectors && <span className="text-blue-400 normal-case font-normal">(alle)</span>}
          </label>
          <button
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            onClick={() => setEditingSectors((v) => !v)}
          >
            {editingSectors ? '✕ sluiten' : '+ bewerken'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {sectors.map((s) => {
            const active = allSectors || config.sectorKeys.includes(s.key);
            return (
              <div
                key={s.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  disabled ? 'opacity-50' : ''
                } ${active ? 'bg-blue-900/40 text-blue-200 border-blue-700' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={active}
                  disabled={disabled}
                  onChange={() => toggle('sectorKeys', s.key)}
                />
                <span className="flex-1">{s.label}</span>
                {editingSectors && (
                  <button
                    className="text-red-500 hover:text-red-400 ml-1 shrink-0"
                    onClick={() => handleRemoveSector(s.key)}
                    title="Verwijder sector"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {!allSectors && (
          <button
            className="text-xs text-blue-400 hover:text-blue-300 mt-1.5"
            onClick={() => onChange({ ...config, sectorKeys: [] })}
            disabled={disabled}
          >
            Selecteer alle
          </button>
        )}

        {/* Add new sector */}
        {editingSectors && (
          <div className="mt-3 space-y-2 bg-gray-800/60 rounded-lg p-3 border border-gray-700">
            <p className="text-xs text-gray-400 font-medium">Sector toevoegen</p>
            <input
              className="input text-xs"
              placeholder="Key (bijv. mode_textiel)"
              value={newSector.key}
              onChange={(e) => setNewSector({ ...newSector, key: e.target.value })}
            />
            <input
              className="input text-xs"
              placeholder="Naam (bijv. Mode & Textiel)"
              value={newSector.label}
              onChange={(e) => setNewSector({ ...newSector, label: e.target.value })}
            />
            <textarea
              className="input text-xs resize-none"
              rows={3}
              placeholder={"Queries (1 per regel):\nmode groothandel\ntextiel leverancier B2B"}
              value={newSector.queries}
              onChange={(e) => setNewSector({ ...newSector, queries: e.target.value })}
            />
            {sectorError && <p className="text-xs text-red-400">{sectorError}</p>}
            <button className="btn-primary text-xs w-full" onClick={handleAddSector}>
              + Toevoegen & Opslaan
            </button>
          </div>
        )}
      </div>

      {/* Countries */}
      <div>
        <label className="label">
          Landen {allCountries && <span className="text-blue-400 normal-case font-normal">(alle)</span>}
        </label>
        <div className="flex gap-2 flex-wrap">
          {COUNTRIES.map((c) => {
            const active = allCountries || config.countryKeys.includes(c.key);
            return (
              <label
                key={c.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm border transition-colors ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${active ? 'bg-blue-900/40 text-blue-200 border-blue-700' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={active}
                  disabled={disabled}
                  onChange={() => toggle('countryKeys', c.key)}
                />
                {c.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Min ERP score */}
      <div>
        <label className="label">
          Min. ERP Score: <span className="text-white font-semibold">{config.minScore}</span>
        </label>
        <input
          type="range" min={0} max={90} step={5}
          value={config.minScore}
          onChange={(e) => onChange({ ...config, minScore: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (meer leads)</span>
          <span>90 (strenger)</span>
        </div>
      </div>

      {/* Concurrency */}
      <div>
        <label className="label">
          Concurrency: <span className="text-white font-semibold">{config.concurrency} parallel</span>
        </label>
        <input
          type="range" min={1} max={15} step={1}
          value={config.concurrency}
          onChange={(e) => onChange({ ...config, concurrency: parseInt(e.target.value) })}
          disabled={disabled}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 (rustig)</span>
          <span>15 (agressief)</span>
        </div>
      </div>

      {/* Email options */}
      <div className="space-y-3">
        <label className="label">Email Validatie</label>

        <div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
          <div>
            <p className="text-sm text-gray-300">DNS MX validatie</p>
            <p className="text-xs text-gray-500">Controleert of domein emails ontvangt</p>
          </div>
          <Toggle
            checked={config.emailValidation}
            disabled={disabled}
            onChange={(e) => onChange({ ...config, emailValidation: e.target.checked })}
          />
        </div>

        <div className={`flex items-center justify-between ${disabled || !config.emailValidation ? 'opacity-50' : ''}`}>
          <div>
            <p className="text-sm text-gray-300">SMTP Handshake</p>
            <p className="text-xs text-gray-500">Trager maar nauwkeuriger</p>
          </div>
          <Toggle
            checked={config.deepValidation}
            disabled={disabled || !config.emailValidation}
            onChange={(e) => onChange({ ...config, deepValidation: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
}
