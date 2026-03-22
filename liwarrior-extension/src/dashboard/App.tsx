import React, { useState } from 'react';
import Pipeline from './pages/Pipeline';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import Templates from './pages/Templates';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

type Page = 'pipeline' | 'companies' | 'contacts' | 'templates' | 'analytics' | 'profile';

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: '📋' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
  { id: 'contacts', label: 'Contacts', icon: '👤' },
  { id: 'templates', label: 'Messages', icon: '💬' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'profile', label: 'My Profile', icon: '⚙️' },
];

export default function App() {
  const [activePage, setActivePage] = useState<Page>('pipeline');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <nav className="w-56 bg-warrior-dark text-white flex-shrink-0 min-h-screen">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-li-blue rounded-lg flex items-center justify-center text-sm font-bold">
              W
            </div>
            <div>
              <h1 className="text-base font-bold">LIWarrior</h1>
              <p className="text-xs text-white/50">Dashboard</p>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                activePage === item.id
                  ? 'bg-li-blue text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-56 p-3 border-t border-white/10">
          <p className="text-xs text-white/30 text-center">
            v0.1.0 — All data stays local
          </p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activePage === 'pipeline' && <Pipeline />}
        {activePage === 'companies' && <Companies />}
        {activePage === 'contacts' && <Contacts />}
        {activePage === 'templates' && <Templates />}
        {activePage === 'analytics' && <Analytics />}
        {activePage === 'profile' && <Profile />}
      </main>
    </div>
  );
}
