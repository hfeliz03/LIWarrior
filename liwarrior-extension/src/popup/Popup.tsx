import React, { useEffect, useState } from 'react';
import type { DashboardStats } from '@/types';

export default function Popup() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response && !response.error) {
        setStats(response);
      }
      setLoading(false);
    });
  }, []);

  const openDashboard = () => {
    chrome.runtime.openOptionsPage();
  };

  const openLinkedInSearch = () => {
    chrome.tabs.create({
      url: 'https://www.linkedin.com/search/results/people/?keywords=recruiter',
    });
  };

  return (
    <div style={{ width: 320, minHeight: 400 }} className="bg-warrior-dark text-white">
      {/* Header */}
      <div className="bg-li-blue px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg font-bold">
            W
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">LIWarrior</h1>
            <p className="text-xs text-white/70">Your networking grind, organized.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-white/50">Loading...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatCard label="Tracked" value={stats.totalContacts} color="blue" />
              <StatCard label="Sent" value={stats.requestsSent} color="yellow" />
              <StatCard label="Accepted" value={stats.connectionsAccepted} color="green" />
              <StatCard label="Messaged" value={stats.messaged} color="blue" />
              <StatCard label="Replied" value={stats.replied} color="yellow" />
              <StatCard label="Meetings" value={stats.meetingsSet} color="green" />
            </div>

            {/* Rates */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-li-light">{stats.acceptanceRate}%</div>
                <div className="text-xs text-white/50">Accept Rate</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-warrior-gold">{stats.replyRate}%</div>
                <div className="text-xs text-white/50">Reply Rate</div>
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">{stats.companiesTracked}</div>
                <div className="text-xs text-white/50">Companies</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-white/70 mb-2">Welcome, Warrior!</p>
            <p className="text-xs text-white/50 mb-4">
              Start by setting up your profile in the dashboard.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={openLinkedInSearch}
            className="w-full bg-li-blue hover:bg-li-dark transition-colors rounded-lg px-4 py-2.5 text-sm font-medium text-left flex items-center gap-2"
          >
            <span>🔍</span>
            <span>Find Recruiters on LinkedIn</span>
          </button>

          <button
            onClick={openDashboard}
            className="w-full bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-4 py-2.5 text-sm font-medium text-left flex items-center gap-2"
          >
            <span>📊</span>
            <span>Open Dashboard</span>
          </button>

          <button
            onClick={() => chrome.tabs.create({ url: 'https://www.linkedin.com/notifications/' })}
            className="w-full bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-4 py-2.5 text-sm font-medium text-left flex items-center gap-2"
          >
            <span>🔔</span>
            <span>Check Notifications</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">LIWarrior v0.1.0 — All data stays local</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-li-light',
    yellow: 'text-warrior-gold',
    green: 'text-green-400',
  };

  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <div className={`text-xl font-bold ${colorMap[color] || 'text-white'}`}>{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
