import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client, { BASE_URL } from '../api/client.js';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import ConfigPanel from '../components/ConfigPanel.jsx';
import Controls from '../components/Controls.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import LogViewer from '../components/LogViewer.jsx';
import LeadTable from '../components/LeadTable.jsx';

const DEFAULT_CONFIG = {
  targetLeads: 100,
  sectorKeys: [],
  countryKeys: [],
  minScore: 50,
  concurrency: 5,
  emailValidation: true,
  deepValidation: false,
  usePuppeteer: true,
};

const LIMIT = 50;

export default function Leads() {
  const { id: listId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const { token } = useAuth();
  const navigate = useNavigate();

  // ── List metadata ──────────────────────────────────────────────────────────
  const [list, setList] = useState(null);

  // ── Scrape config ──────────────────────────────────────────────────────────
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [sectors, setSectors] = useState([]);

  // ── Job state ──────────────────────────────────────────────────────────────
  const [jobStatus, setJobStatus] = useState('idle'); // idle | running | stopping | done | error
  const [wsStatus, setWsStatus] = useState({});       // live counters for ProgressBar
  const [logs, setLogs] = useState([]);
  const [liveLeads, setLiveLeads] = useState([]);     // leads via WS (live)
  const jobStartRef = useRef(null);
  const timerRef = useRef(null);

  // ── DB leads (paginated) ───────────────────────────────────────────────────
  const [dbLeads, setDbLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScore, setFilterScore] = useState(0);

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Fetch list metadata ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeWorkspace) { navigate('/workspaces'); return; }
    client.get(`/lists?workspaceId=${activeWorkspace.id}`)
      .then((res) => setList(res.data.find((l) => l.id === listId) ?? null))
      .catch(() => {});
  }, [activeWorkspace, listId, navigate]);

  // ── Fetch sectors for ConfigPanel (depends on list use_case) ─────────────
  useEffect(() => {
    if (!list) return;
    const useCase = list.use_case ?? 'erp';
    client.get(`/config/sectors?useCase=${useCase}`).then((res) => setSectors(res.data)).catch(() => {});
  }, [list]);

  const handleSectorsChange = useCallback(async (updated) => {
    setSectors(updated);
    client.post('/config/sectors', updated).catch(() => {});
  }, []);

  // ── Fetch leads from DB ───────────────────────────────────────────────────
  const fetchLeads = useCallback(() => {
    if (!activeWorkspace || !listId) return;
    setTableLoading(true);
    const params = new URLSearchParams({
      workspaceId: activeWorkspace.id,
      listId,
      page,
      limit: LIMIT,
      minScore: filterScore,
      search,
    });
    client.get(`/leads?${params}`)
      .then((res) => { setDbLeads(res.data.data); setTotal(res.data.total); })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }, [activeWorkspace, listId, page, filterScore, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [search, filterScore]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useWebSocket(token, {
    onEvent: (type, payload) => {
      switch (type) {
        case 'job_started':
          setJobStatus('running');
          setLiveLeads([]);
          setLogs([]);
          setElapsedSeconds(0);
          jobStartRef.current = Date.now();
          setWsStatus({ totalQueries: payload?.queries ?? 0, processedQueries: 0, leadsFound: 0, processedDomains: 0, errorsCount: 0 });
          // tick timer
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - jobStartRef.current) / 1000));
          }, 1000);
          break;

        case 'query_start':
          setWsStatus((s) => ({
            ...s,
            processedQueries: (s.processedQueries ?? 0) + 1,
            currentSector: payload?.sector ?? s.currentSector,
            currentCountry: payload?.country ?? s.currentCountry,
          }));
          break;

        case 'domains_found':
          setWsStatus((s) => ({ ...s, totalDomains: (s.totalDomains ?? 0) + (payload?.count ?? 0) }));
          break;

        case 'lead':
          if (payload?.lead) {
            setLiveLeads((prev) => {
              if (prev.some((l) => l.domain === payload.lead.domain)) return prev;
              return [payload.lead, ...prev];
            });
            setWsStatus((s) => ({ ...s, leadsFound: (s.leadsFound ?? 0) + 1 }));
          }
          break;

        case 'progress':
          setWsStatus((s) => ({
            ...s,
            leadsFound: payload?.counters?.leadsFound ?? s.leadsFound,
            processedDomains: (s.processedDomains ?? 0) + 1,
            errorsCount: payload?.counters?.errorsCount ?? s.errorsCount,
            currentDomain: payload?.domain ?? s.currentDomain,
          }));
          break;

        case 'search_progress':
          setWsStatus((s) => ({ ...s, lastSearch: payload }));
          break;

        case 'log':
          setLogs((prev) => [...prev.slice(-499), { level: payload?.level ?? 'info', message: payload?.message ?? '', ts: Date.now() }]);
          break;

        case 'job_done':
          clearInterval(timerRef.current);
          setJobStatus(payload?.finalStatus === 'stopped' ? 'done' : 'done');
          setWsStatus((s) => ({ ...s, leadsFound: payload?.counters?.leadsFound ?? s.leadsFound }));
          // Reload DB leads after job completes
          setTimeout(() => fetchLeads(), 500);
          break;

        case 'job_error':
          clearInterval(timerRef.current);
          setJobStatus('error');
          break;
      }
    },
  });

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Build ProgressBar status object ───────────────────────────────────────
  const pbStatus = {
    status: jobStatus,
    leadsFound: wsStatus.leadsFound ?? 0,
    processedDomains: wsStatus.processedDomains ?? 0,
    totalDomains: wsStatus.totalDomains ?? 0,
    processedQueries: wsStatus.processedQueries ?? 0,
    totalQueries: wsStatus.totalQueries ?? 0,
    errors: wsStatus.errorsCount ?? 0,
    elapsedSeconds,
    currentSector: wsStatus.currentSector ?? '',
    currentCountry: wsStatus.currentCountry ?? '',
    currentDomain: wsStatus.currentDomain ?? '',
    searchSource: config.usePuppeteer !== false ? 'Puppeteer' : 'HTTP',
    puppeteerActive: jobStatus === 'running' && config.usePuppeteer !== false,
    progressPct: config.targetLeads > 0
      ? Math.min(100, Math.round(((wsStatus.leadsFound ?? 0) / config.targetLeads) * 100))
      : 0,
    leadsPerMinute: elapsedSeconds > 10
      ? Math.round(((wsStatus.leadsFound ?? 0) / elapsedSeconds) * 60 * 10) / 10
      : 0,
    eta: elapsedSeconds > 10 && (wsStatus.leadsFound ?? 0) > 0
      ? Math.round(((config.targetLeads - (wsStatus.leadsFound ?? 0)) / (wsStatus.leadsFound / elapsedSeconds)))
      : null,
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleStart() {
    try {
      await client.post(`/lists/${listId}/extend`, {
        workspaceId: activeWorkspace.id,
        config,
      });
      // jobStatus set via WS job_started event
    } catch (err) {
      alert(err.response?.data?.error ?? 'Starten mislukt');
    }
  }

  async function handleStop() {
    setJobStatus('stopping');
    try {
      await client.post('/scrape/stop', { workspaceId: activeWorkspace.id });
    } catch {
      // ignore
    }
  }

  // ── Combined leads: live (WS) on top, DB below ────────────────────────────
  // When running, prepend live leads to DB leads (deduped by domain)
  const liveDomainsInDb = new Set(dbLeads.map((l) => l.domain));
  const filteredLive = liveLeads.filter((l) => !liveDomainsInDb.has(l.domain));
  const displayLeads = [...filteredLive, ...dbLeads];

  const isActive = jobStatus === 'running' || jobStatus === 'stopping';
  const hasActivity = jobStatus !== 'idle';
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-full -m-6">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-800 bg-gray-900/60 shrink-0">
        <div className="min-w-0">
          <div className="text-xs text-gray-500 mb-0.5">
            <Link to="/lists" className="hover:text-gray-300">Lijsten</Link>
            <span className="mx-1.5">›</span>
            <span className="text-gray-400">{list?.name ?? '...'}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-white truncate">{list?.name ?? '...'}</h1>
            <span className="badge badge-gray">{(total + filteredLive.length).toLocaleString('nl-NL')} leads</span>
            {list?.target_leads && (
              <span className="text-xs text-gray-500">
                doel: {list.target_leads}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.open(`${BASE_URL}/download/csv`, '_blank')} className="btn-ghost btn-sm">↓ CSV</button>
          <button onClick={() => window.open(`${BASE_URL}/download/xlsx`, '_blank')} className="btn-primary btn-sm">↓ Excel</button>
        </div>
      </div>

      {/* ── Main two-col layout ──────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Config sidebar */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-gray-800 bg-gray-900/30 p-4 space-y-4">
          <ConfigPanel
            config={config}
            onChange={setConfig}
            disabled={isActive}
            sectors={sectors}
            onSectorsChange={handleSectorsChange}
            useCase={list?.use_case ?? 'erp'}
          />
        </aside>

        {/* Main content — two rows: fixed top zone + independent scroll zone */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">

          {/* ── Fixed top zone: Controls + live progress ─────────────────── */}
          <div className="shrink-0 p-5 space-y-4 border-b border-gray-800">
            <Controls
              status={jobStatus}
              onStart={handleStart}
              onStop={handleStop}
              leadsCount={total + filteredLive.length}
            />
            {hasActivity && (
              <>
                <ProgressBar status={pbStatus} lastSearch={wsStatus.lastSearch ?? null} />
                <LogViewer logs={logs} autoScroll={isActive} />
              </>
            )}
          </div>

          {/* ── Scrollable table zone ─────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ overflowAnchor: 'none' }}>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                className="input max-w-xs"
                placeholder="Zoeken op domein of email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 whitespace-nowrap">Min. score:</label>
                <select
                  className="input w-28"
                  value={filterScore}
                  onChange={(e) => setFilterScore(Number(e.target.value))}
                >
                  <option value={0}>Alle</option>
                  <option value={40}>40+</option>
                  <option value={50}>50+</option>
                  <option value={60}>60+</option>
                  <option value={70}>70+</option>
                  <option value={80}>80+</option>
                </select>
              </div>
              {isActive && filteredLive.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {filteredLive.length} live
                </span>
              )}
            </div>

            <LeadTable leads={displayLeads} loading={tableLoading && !isActive} useCase={list?.use_case ?? 'erp'} />

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-gray-500">
                  Pagina {page} van {totalPages} ({total.toLocaleString('nl-NL')} opgeslagen leads)
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    ← Vorige
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Volgende →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
