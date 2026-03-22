import React, { useEffect, useState } from 'react';
import type { DashboardStats, Contact } from '@/types';

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (res) => {
      if (res && !res.error) setStats(res);
    });
    chrome.runtime.sendMessage({ type: 'GET_CONTACTS' }, (res) => {
      if (Array.isArray(res)) setContacts(res);
    });
  }, []);

  // Group by company for company-level stats
  const companyStats = contacts.reduce<Record<string, { total: number; connected: number; replied: number; meetings: number }>>((acc, c) => {
    const company = c.company || 'Unknown';
    if (!acc[company]) acc[company] = { total: 0, connected: 0, replied: 0, meetings: 0 };
    acc[company].total++;
    if (['accepted', 'messaged', 'replied', 'meeting_set'].includes(c.status)) acc[company].connected++;
    if (['replied', 'meeting_set'].includes(c.status)) acc[company].replied++;
    if (c.status === 'meeting_set') acc[company].meetings++;
    return acc;
  }, {});

  // Commonality effectiveness
  const commonalityStats = contacts
    .filter((c) => c.commonalities && c.commonalities.length > 0)
    .reduce<Record<string, { total: number; replied: number }>>((acc, c) => {
      const type = c.commonalities[0]?.type || 'none';
      if (!acc[type]) acc[type] = { total: 0, replied: 0 };
      acc[type].total++;
      if (['replied', 'meeting_set'].includes(c.status)) acc[type].replied++;
      return acc;
    }, {});

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-500 mt-1">See what's working in your networking grind.</p>
      </div>

      {stats && (
        <>
          {/* Funnel */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Networking Funnel</h3>
            <div className="space-y-3">
              <FunnelBar label="Discovered" value={stats.totalContacts} max={stats.totalContacts} color="bg-gray-300" />
              <FunnelBar label="Requests Sent" value={stats.requestsSent} max={stats.totalContacts} color="bg-blue-400" />
              <FunnelBar label="Accepted" value={stats.connectionsAccepted} max={stats.totalContacts} color="bg-green-400" />
              <FunnelBar label="Messaged" value={stats.messaged} max={stats.totalContacts} color="bg-purple-400" />
              <FunnelBar label="Replied" value={stats.replied} max={stats.totalContacts} color="bg-yellow-400" />
              <FunnelBar label="Meetings Set" value={stats.meetingsSet} max={stats.totalContacts} color="bg-emerald-500" />
            </div>
          </div>

          {/* Company breakdown */}
          {Object.keys(companyStats).length > 0 && (
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">By Company</h3>
              <div className="space-y-2">
                {Object.entries(companyStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([company, s]) => (
                    <div key={company} className="flex items-center gap-3 text-sm">
                      <span className="w-40 font-medium text-gray-700 truncate">{company}</span>
                      <span className="text-gray-500">{s.total} found</span>
                      <span className="text-green-600">{s.connected} connected</span>
                      <span className="text-yellow-600">{s.replied} replied</span>
                      <span className="text-purple-600">{s.meetings} meetings</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Commonality effectiveness */}
          {Object.keys(commonalityStats).length > 0 && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Commonality Effectiveness</h3>
              <p className="text-sm text-gray-500 mb-3">Which shared connections get the best replies?</p>
              <div className="space-y-2">
                {Object.entries(commonalityStats)
                  .sort((a, b) => {
                    const rateA = b[1].total > 0 ? b[1].replied / b[1].total : 0;
                    const rateB = a[1].total > 0 ? a[1].replied / a[1].total : 0;
                    return rateA - rateB;
                  })
                  .map(([type, s]) => (
                    <div key={type} className="flex items-center gap-3 text-sm">
                      <span className="w-32 font-medium text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                      <span className="text-gray-500">{s.total} contacts</span>
                      <span className="text-green-600">{s.replied} replied</span>
                      <span className="text-warrior-gold font-medium">
                        {s.total > 0 ? Math.round((s.replied / s.total) * 100) : 0}% reply rate
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {(!stats || stats.totalContacts === 0) && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-gray-800">No data yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Analytics will populate as you start networking.
          </p>
        </div>
      )}
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}
