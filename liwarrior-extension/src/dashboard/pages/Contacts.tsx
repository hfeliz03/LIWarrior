import React, { useEffect, useState } from 'react';
import type { Contact, ContactStatus } from '@/types';

const STATUS_LABELS: Record<ContactStatus, { label: string; color: string }> = {
  discovered: { label: 'Discovered', color: 'bg-gray-100 text-gray-700' },
  request_sent: { label: 'Request Sent', color: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
  messaged: { label: 'Messaged', color: 'bg-purple-100 text-purple-700' },
  replied: { label: 'Replied', color: 'bg-yellow-100 text-yellow-800' },
  meeting_set: { label: 'Meeting Set', color: 'bg-emerald-100 text-emerald-700' },
  cold: { label: 'Cold', color: 'bg-red-100 text-red-700' },
};

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = () => {
      chrome.runtime.sendMessage({ type: 'GET_CONTACTS' }, (res) => {
        if (Array.isArray(res)) setContacts(res);
      });
    };

    fetchData();

    // Listen for live updates from service worker
    const listener = (message: any) => {
      if (message.type === 'DB_UPDATED') {
        fetchData();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const filteredContacts = contacts.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.fullName?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyDraft = (contactId: string) => {
    chrome.runtime.sendMessage(
      { type: 'GENERATE_MESSAGE', data: { contactId, type: 'initial_message' } },
      (res) => {
        if (res?.draft) {
          navigator.clipboard.writeText(res.draft);
          alert('Draft copied to clipboard!');
        }
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Contacts</h2>
        <p className="text-gray-500 mt-1">{contacts.length} contacts tracked</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, or title..."
          className="flex-1 min-w-48 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Pic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Commonalities</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <ContactAvatar contact={contact} />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={contact.profileUrl}
                    target="_blank"
                    rel="noopener"
                    className="font-medium text-gray-900 hover:text-li-blue"
                  >
                    {contact.fullName || `${contact.firstName} ${contact.lastName}`}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{contact.title}</td>
                <td className="px-4 py-3 text-gray-600">{contact.company}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[contact.status]?.color || ''}`}>
                    {STATUS_LABELS[contact.status]?.label || contact.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {contact.commonalities?.length > 0 ? (
                    <div className="flex gap-1">
                      {contact.commonalities.slice(0, 2).map((c, i) => (
                        <span key={i} className="bg-warrior-gold/15 text-warrior-gold text-xs px-1.5 py-0.5 rounded font-medium">
                          {c.type}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">None found</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {contact.status === 'accepted' && (
                    <button
                      onClick={() => copyDraft(contact.id)}
                      className="text-li-blue text-xs font-medium hover:underline"
                    >
                      Copy Draft
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {contacts.length === 0
              ? 'No contacts tracked yet. Browse LinkedIn to discover people!'
              : 'No contacts match your filters.'}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactAvatar({ contact }: { contact: Contact }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = contact.firstName?.[0] || contact.fullName?.[0] || '?';

  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-li-blue border flex items-center justify-center">
      {contact.imageUrl && !imgFailed ? (
        <img
          src={contact.imageUrl}
          className="w-full h-full object-cover"
          alt=""
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-xs font-bold text-white">{initials}</span>
      )}
    </div>
  );
}
