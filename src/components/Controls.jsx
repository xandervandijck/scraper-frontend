import React from 'react';

export default function Controls({ status, onStart, onStop, leadsCount }) {
  const isRunning = status === 'running';
  const isStopping = status === 'stopping';
  const isDone = status === 'done';
  const isIdle = status === 'idle';

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isRunning ? 'bg-green-400 animate-pulse' :
              isStopping ? 'bg-yellow-400 animate-pulse' :
              isDone ? 'bg-blue-400' :
              'bg-gray-600'
            }`}
          />
          <span className="text-sm font-medium text-gray-300">
            {isRunning ? 'Bezig...' :
             isStopping ? 'Stoppen...' :
             isDone ? 'Klaar' :
             'Gereed'}
          </span>
        </div>

        {leadsCount > 0 && (
          <span className="badge bg-blue-900/60 text-blue-300 border border-blue-700">
            {leadsCount} leads
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-primary text-base px-6 py-2.5 disabled:opacity-50"
          onClick={onStart}
          disabled={isRunning || isStopping}
        >
          <span>▶</span>
          {isDone ? 'Opnieuw Starten' : 'Start'}
        </button>

        <button
          className="btn-danger px-5 py-2.5 disabled:opacity-50"
          onClick={onStop}
          disabled={!isRunning}
        >
          <span>■</span>
          Stop
        </button>
      </div>
    </div>
  );
}
