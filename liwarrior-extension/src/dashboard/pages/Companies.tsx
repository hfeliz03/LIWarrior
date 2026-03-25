import React, { useEffect, useState } from 'react';
import type { TargetCompany, Contact } from '@/types';

export default function Companies() {
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  useEffect(() => {
    const fetchData = () => {
      chrome.runtime.sendMessage({ type: 'GET_COMPANIES' }, (res) => {
        if (Array.isArray(res)) setCompanies(res);
      });
      chrome.runtime.sendMessage({ type: 'GET_CONTACTS' }, (res) => {
        if (Array.isArray(res)) setContacts(res);
      });
    };

    fetchData();

    // Listen for live updates from service worker
    const listener = (message: any) => {
      if (message.type === 'DB_UPDATED') {
        console.log('[LIWarrior] Live update received, refreshing data...');
        fetchData();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const addCompany = () => {
    if (!newCompanyName.trim()) return;
    const companyData = {
      name: newCompanyName.trim(),
      linkedInUrl: `https://www.linkedin.com/company/${newCompanyName.trim().toLowerCase().replace(/\s+/g, '-')}`,
    };
    chrome.runtime.sendMessage({ type: 'ADD_COMPANY', data: companyData }, (id) => {
      setCompanies((prev) => [{ ...companyData, id, logoUrl: '', addedAt: new Date() } as TargetCompany, ...prev]);
      setNewCompanyName('');
      setSearchTerm('');
    });
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyStats = (companyName: string) => {
    const query = companyName.toLowerCase();
    const companyContacts = contacts.filter(
      (c) => c.company?.toLowerCase().includes(query) || query.includes(c.company?.toLowerCase() || '')
    );
    return {
      total: companyContacts.length,
      connected: companyContacts.filter((c) =>
        ['accepted', 'messaged', 'replied', 'meeting_set'].includes(c.status)
      ).length,
      replied: companyContacts.filter((c) =>
        ['replied', 'meeting_set'].includes(c.status)
      ).length,
      meetings: companyContacts.filter((c) => c.status === 'meeting_set').length,
    };
  };

  const searchOnLinkedIn = (companyName: string) => {
    const query = encodeURIComponent(`recruiter "${companyName}"`);
    chrome.tabs.create({
      url: `https://www.linkedin.com/search/results/people/?keywords=${query}`,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Target Companies</h2>
        <p className="text-gray-500 mt-1">
          Add companies you're targeting, then search for recruiters on LinkedIn.
        </p>
      </div>

      {/* LinkedIn-style Searcher */}
      <div className="relative mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setNewCompanyName(e.target.value);
                setIsDropdownOpen(e.target.value.length > 0);
              }}
              onFocus={() => setIsDropdownOpen(searchTerm.length > 0)}
              placeholder="Search or add a company (e.g., Bloomberg)"
              className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue bg-white"
            />
            
            {/* Autocomplete Dropdown */}
            {isDropdownOpen && filteredCompanies.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-xl mt-1 z-50 overflow-hidden">
                {filteredCompanies.slice(0, 5).map(company => (
                  <div 
                    key={company.id}
                    onClick={() => {
                      chrome.tabs.create({ url: company.linkedInUrl });
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 transition-colors"
                  >
                    <div className="w-8 h-8 bg-li-blue/10 rounded flex items-center justify-center text-xs font-bold text-li-blue">
                      {company.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{company.name}</div>
                      <div className="text-[10px] text-gray-400">Jump to Company Profile ↗</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={addCompany}
            className="bg-li-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-li-dark transition-all shadow-md active:scale-95 disabled:opacity-50"
            disabled={!searchTerm.trim() || companies.some(c => c.name.toLowerCase() === searchTerm.toLowerCase())}
          >
            Add New
          </button>
        </div>
        {searchTerm.length > 0 && filteredCompanies.length === 0 && (
          <p className="text-[10px] text-gray-400 mt-1 ml-1">
            ✨ Tip: Click "Add New" to start tracking "{searchTerm}"
          </p>
        )}
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.map((company) => {
          const stats = getCompanyStats(company.name);
          return (
            <div key={company.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-li-blue/10 rounded-lg flex items-center justify-center text-lg font-bold text-li-blue">
                  {company.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-xs text-gray-400">
                    Added {new Date(company.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{stats.total}</div>
                  <div className="text-xs text-gray-400">Found</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.connected}</div>
                  <div className="text-xs text-gray-400">Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-warrior-gold">{stats.replied}</div>
                  <div className="text-xs text-gray-400">Replied</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{stats.meetings}</div>
                  <div className="text-xs text-gray-400">Meetings</div>
                </div>
              </div>

              <button
                onClick={() => searchOnLinkedIn(company.name)}
                className="w-full bg-li-blue/10 text-li-blue text-sm px-3 py-2 rounded-lg font-medium hover:bg-li-blue/20 transition-colors"
              >
                🔍 Find Recruiters on LinkedIn
              </button>
            </div>
          );
        })}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-4xl mb-3">🏢</div>
          <h3 className="text-lg font-semibold text-gray-800">No target companies yet</h3>
          <p className="text-gray-500 text-sm mt-1">
            Add companies you want to work at to start tracking your networking efforts.
          </p>
        </div>
      )}
    </div>
  );
}
