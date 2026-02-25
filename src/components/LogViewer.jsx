import React, { useEffect, useRef } from 'react';

const LEVEL_STYLES = {
  info: 'text-gray-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  success: 'text-green-400',
};

const LEVEL_PREFIX = {
  info: '○',
  warn: '△',
  error: '✕',
  success: '✓',
};

export default function LogViewer({ logs = [], autoScroll = true }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div className="card flex flex-col h-72">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="text-purple-400">▣</span> Activiteit Log
        </h2>
        <span className="text-xs text-gray-600">{logs.length} entries</span>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5 pr-1">
        {logs.length === 0 ? (
          <p className="text-gray-600 italic py-4 text-center">Nog geen activiteit...</p>
        ) : (
          logs.map((entry, i) => (
            <div key={i} className={`flex items-start gap-2 py-0.5 ${LEVEL_STYLES[entry.level] ?? 'text-gray-400'}`}>
              <span className="shrink-0 mt-px">{LEVEL_PREFIX[entry.level] ?? '·'}</span>
              <span className="text-gray-600 shrink-0 tabular-nums">
                {new Date(entry.ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="leading-relaxed break-all">{entry.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
