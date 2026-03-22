import React, { useEffect, useState } from 'react';
import type { TargetCompany, Contact } from '@/types';

export default function Companies() {
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_COMPANIES' }, (res) => {
      if (Array.isArray(res)) setCompanies(res);
    });
    chrome.runtime.sendMessage({ type: 'GET_CONTACTS' }, (res) => {
      if (Array.isArray(res)) setContacts(res);
    });
  }, []);

  const addCompany = () => {
    if (!newCompany.trim()) return;
    const companyData = {
      name: newCompany.trim(),
      linkedInUrl: `https://www.linkedin.com/company/${newCompany.trim().toLowerCase().replace(/\s+/g, '-')}`,
    };
    chrome.runtime.sendMessage({ type: 'ADD_COMPANY', data: companyData }, (id) => {
      setCompanies((prev) => [...prev, { ...companyData, id, logoUrl: '', addedAt: new Date() } as TargetCompany]);
      setNewCompany('');
    });
  };

  const getCompanyStats = (companyName: string) => {
    const companyContacts = contacts.filter(
      (c) => c.company?.toLowerCase() === companyName.toLowerCase()
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

      {/* Add company */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCompany()}
          placeholder="Add a company (e.g., Microsoft)"
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
        />
        <button
          onClick={addCompany}
          className="bg-li-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-li-dark transition-colors"
        >
          Add Company
        </button>
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => {
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
