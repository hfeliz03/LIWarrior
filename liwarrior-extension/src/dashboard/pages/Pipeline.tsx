import React, { useEffect, useState } from 'react';
import type { Contact, ContactStatus, DashboardStats } from '@/types';

const PIPELINE_STAGES: { status: ContactStatus; label: string; icon: string; color: string }[] = [
  { status: 'discovered', label: 'Discovered', icon: '🔍', color: 'bg-gray-100 border-gray-300' },
  { status: 'request_sent', label: 'Request Sent', icon: '📤', color: 'bg-blue-50 border-blue-300' },
  { status: 'accepted', label: 'Accepted', icon: '🤝', color: 'bg-green-50 border-green-300' },
  { status: 'messaged', label: 'Messaged', icon: '💬', color: 'bg-purple-50 border-purple-300' },
  { status: 'replied', label: 'Replied', icon: '↩️', color: 'bg-yellow-50 border-yellow-300' },
  { status: 'meeting_set', label: 'Meeting Set', icon: '📅', color: 'bg-emerald-50 border-emerald-300' },
];

export default function Pipeline() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CONTACTS' }, (response) => {
      if (Array.isArray(response)) setContacts(response);
    });
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response && !response.error) setStats(response);
    });
  }, []);

  const contactsByStatus = (status: ContactStatus) =>
    contacts.filter((c) => c.status === status);

  const updateStatus = (contactId: string, status: ContactStatus) => {
    chrome.runtime.sendMessage(
      { type: 'UPDATE_CONTACT_STATUS', data: { contactId, status } },
      () => {
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? { ...c, status } : c))
        );
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Networking Pipeline <span className="text-red-500 font-mono text-base">[v2]</span></h2>
        <p className="text-gray-500 mt-1">
          Track your connections through every stage of the networking process.
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex gap-4 mb-6">
          <div className="bg-red-600 rounded-xl border px-4 py-3 flex-1 text-center shadow-lg transform scale-105">
            <div className="text-2xl font-bold text-white">{stats.totalContacts}</div>
            <div className="text-xs text-white">Total Contacts [V2]</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.acceptanceRate}%</div>
            <div className="text-xs text-gray-500">Accept Rate</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-warrior-gold">{stats.replyRate}%</div>
            <div className="text-xs text-gray-500">Reply Rate</div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3 flex-1 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.meetingsSet}</div>
            <div className="text-xs text-gray-500">Meetings</div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageContacts = contactsByStatus(stage.status);
          return (
            <div
              key={stage.status}
              className={`flex-shrink-0 w-64 rounded-xl border-2 ${stage.color} p-3`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span>{stage.icon}</span>
                <h3 className="font-semibold text-sm text-gray-800">{stage.label}</h3>
                <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs font-medium text-gray-600">
                  {stageContacts.length}
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stageContacts.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    No contacts here yet
                  </div>
                ) : (
                  stageContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onUpdateStatus={updateStatus}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border mt-4">
          <div className="text-4xl mb-3">⚔️</div>
          <h3 className="text-lg font-semibold text-gray-800">No contacts yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Browse LinkedIn with the extension active and contacts will start appearing
            here as you discover and connect with people.
          </p>
          <button
            onClick={() =>
              chrome.tabs.create({
                url: 'https://www.linkedin.com/search/results/people/?keywords=recruiter',
              })
            }
            className="mt-4 bg-li-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-li-dark transition-colors"
          >
            Start Finding Recruiters
          </button>
        </div>
      )}
    </div>
  );
}

function ContactCard({
  contact,
  onUpdateStatus,
}: {
  contact: Contact;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
}) {
  const nextStatus: Record<string, ContactStatus | undefined> = {
    discovered: 'request_sent',
    request_sent: undefined, // Acceptance is detected automatically
    accepted: 'messaged',
    messaged: 'replied',
    replied: 'meeting_set',
    meeting_set: undefined,
  };

  const next = nextStatus[contact.status];

  const generateDraft = () => {
    chrome.runtime.sendMessage(
      { type: 'GENERATE_MESSAGE', data: { contactId: contact.id, type: 'initial_message' } },
      (response) => {
        if (response?.draft) {
          navigator.clipboard.writeText(response.draft);
          alert('Message draft copied to clipboard!');
        }
      }
    );
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 bg-li-blue/10 flex items-center justify-center">
          {contact.imageUrl ? (
            <img 
              src={contact.imageUrl} 
              alt={contact.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails, hide it and just keep the background
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xs font-bold text-li-blue">
              {contact.firstName?.[0] || contact.fullName?.[0] || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <a
            href={contact.profileUrl}
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-gray-900 hover:text-li-blue truncate block"
          >
            {contact.fullName || `${contact.firstName} ${contact.lastName}`}
          </a>
          <p className="text-xs text-gray-500 truncate">{contact.title}</p>
          <p className="text-xs text-gray-400 truncate">{contact.company}</p>
        </div>
      </div>

      {/* Commonality badges */}
      {contact.commonalities && contact.commonalities.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.commonalities.slice(0, 2).map((c, i) => (
            <span
              key={i}
              className="inline-block bg-warrior-gold/15 text-warrior-gold text-xs px-1.5 py-0.5 rounded font-medium"
            >
              {c.type === 'university' && '🎓'}
              {c.type === 'language' && '🗣️'}
              {c.type === 'last_name' && '👨‍👩‍👦'}
              {c.type === 'company' && '🏢'}
              {c.type === 'location' && '📍'}
              {' '}{c.contactValue}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-2">
        {contact.status === 'accepted' && (
          <button
            onClick={generateDraft}
            className="flex-1 bg-li-blue text-white text-xs px-2 py-1 rounded font-medium hover:bg-li-dark"
          >
            Draft Message
          </button>
        )}
        {next && (
          <button
            onClick={() => onUpdateStatus(contact.id, next)}
            className="flex-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium hover:bg-gray-200"
          >
            Move to {next.replace('_', ' ')}
          </button>
        )}
      </div>
    </div>
  );
}
