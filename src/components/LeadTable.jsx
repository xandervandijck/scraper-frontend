import React, { useState } from 'react';

function ScoreBadge({ score }) {
  const s = Number(score) || 0;
  const color =
    s >= 70 ? 'bg-green-900/60 text-green-300 border-green-700' :
    s >= 50 ? 'bg-yellow-900/60 text-yellow-300 border-yellow-700' :
    'bg-red-900/60 text-red-300 border-red-700';
  return (
    <span className={`badge border ${color} tabular-nums font-bold`}>{s}</span>
  );
}

/**
 * LeadTable — SaaS version.
 * Receives leads already filtered/paginated from the parent (Leads.jsx).
 * Parent handles search, minScore, page state.
 */
export default function LeadTable({ leads = [], loading = false }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (loading) {
    return (
      <div className="card text-center py-10 text-sm text-gray-500">
        Laden...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card text-center py-12 text-sm text-gray-600">
        Geen leads gevonden voor deze filters.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bedrijf</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sector</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Land</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {leads.map((lead, i) => {
              // Backend uses snake_case; support both
              const domain = lead.domain ?? lead.website;
              const company = lead.company_name ?? lead.companyName ?? domain;
              const email = lead.email;
              const phone = lead.phone;
              const sector = lead.sector;
              const country = lead.country;
              const score = lead.erp_score ?? lead.erpScore ?? 0;

              return (
                <React.Fragment key={lead.id ?? domain ?? i}>
                  <tr className="table-row-hover">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-200 truncate max-w-[160px]">{company}</div>
                      {domain && (
                        <a
                          href={lead.website ?? `https://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 truncate max-w-[160px] block"
                        >
                          {domain}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {email ? (
                        <a href={`mailto:${email}`} className="text-xs text-gray-300 hover:text-white truncate block max-w-[150px]">
                          {email}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {phone ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 truncate max-w-[100px]">
                      {sector ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {country ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <ScoreBadge score={score} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      >
                        {expandedRow === i ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>

                  {expandedRow === i && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 bg-gray-800/40">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 mb-1 font-medium uppercase tracking-wider">Adres</p>
                            <p className="text-gray-400">{lead.address ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1 font-medium uppercase tracking-wider">Alle e-mails</p>
                            {(lead.all_emails ?? []).map((e) => (
                              <p key={e} className="text-gray-400 truncate">{e}</p>
                            ))}
                            {!(lead.all_emails?.length) && <p className="text-gray-600">—</p>}
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1 font-medium uppercase tracking-wider">Omschrijving</p>
                            <p className="text-gray-400 line-clamp-4">{lead.description ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
