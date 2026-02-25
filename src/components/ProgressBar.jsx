import React from 'react';

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatETA(seconds) {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatElapsed(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}u ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ProgressBar({ status, lastSearch }) {
  const {
    progressPct = 0,
    leadsFound = 0,
    processedDomains = 0,
    totalDomains = 0,
    processedQueries = 0,
    totalQueries = 0,
    leadsPerMinute = 0,
    eta = null,
    errors = 0,
    elapsedSeconds = 0,
    currentSector = '',
    currentCountry = '',
    currentDomain = '',
    searchSource = 'Puppeteer',
    puppeteerActive = false,
  } = status ?? {};

  const isActive = status?.status === 'running' || status?.status === 'stopping';

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="text-green-400">◉</span> Live Dashboard
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search source badge */}
          <span className={`badge border text-xs ${
            searchSource === 'Puppeteer'
              ? puppeteerActive
                ? 'bg-purple-900/50 text-purple-300 border-purple-700'
                : 'bg-gray-800 text-gray-500 border-gray-700'
              : 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
          }`}>
            {searchSource === 'Puppeteer' ? '⬡ Puppeteer' : '⬡ HTTP'}
            {puppeteerActive && searchSource === 'Puppeteer' && <span className="ml-1 text-green-400">●</span>}
          </span>

          {/* Last search info */}
          {lastSearch && (
            <span className={`badge border text-xs ${
              lastSearch.blocked
                ? 'bg-red-900/40 text-red-300 border-red-700'
                : 'bg-gray-800 text-gray-500 border-gray-700'
            }`}>
              {lastSearch.blocked ? '⚠ geblokkeerd' : `${lastSearch.resultsFound} urls`}
            </span>
          )}

          {isActive && currentDomain && (
            <span className="text-xs text-gray-500 truncate max-w-xs">→ {currentDomain}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{processedDomains} / {totalDomains || '?'} sites</span>
          <span>{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isActive ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gray-600'
            }`}
            style={{ width: `${Math.max(progressPct, isActive ? 2 : 0)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Queries: {processedQueries}/{totalQueries}</span>
          <span>{currentSector && `${currentSector} • ${currentCountry}`}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Leads"
          value={leadsFound}
          color="text-green-400"
          sub="gevonden"
        />
        <StatCard
          label="Leads/min"
          value={leadsPerMinute}
          color="text-blue-400"
          sub="huidig tempo"
        />
        <StatCard
          label="ETA"
          value={formatETA(eta)}
          color="text-yellow-400"
          sub="geschat"
        />
        <StatCard
          label="Verstreken"
          value={formatElapsed(elapsedSeconds)}
          color="text-gray-300"
        />
        <StatCard
          label="Fouten"
          value={errors}
          color={errors > 10 ? 'text-red-400' : 'text-gray-400'}
          sub="overgeslagen"
        />
      </div>
    </div>
  );
}
