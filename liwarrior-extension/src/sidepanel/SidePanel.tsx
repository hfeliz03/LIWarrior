import React, { useEffect, useState } from 'react';
import type { Contact } from '@/types';

export default function SidePanel() {
  const [contact, setContact] = useState<Contact | null>(null);
  const [draft, setDraft] = useState('');
  const [commonalityUsed, setCommonalityUsed] = useState('');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // Listen for contact changes from storage
    const loadContact = async () => {
      const result = await chrome.storage.local.get('sidepanelContactId');
      if (result.sidepanelContactId) {
        chrome.runtime.sendMessage(
          { type: 'GET_CONTACTS' },
          (contacts: Contact[]) => {
            const found = contacts?.find((c) => c.id === result.sidepanelContactId);
            if (found) {
              setContact(found);
              // Generate draft
              chrome.runtime.sendMessage(
                { type: 'GENERATE_MESSAGE', data: { contactId: found.id, type: 'initial_message' } },
                (res) => {
                  if (res?.draft) {
                    setDraft(res.draft);
                    setCommonalityUsed(res.commonality || '');
                  }
                }
              );
            }
          }
        );
      }
    };

    loadContact();

    // Listen for updates
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.sidepanelContactId) {
        loadContact();
      }
    });
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openChat = () => {
    if (contact) {
      const name = encodeURIComponent(contact.fullName || contact.firstName);
      chrome.tabs.create({
        url: `https://www.linkedin.com/messaging/thread/new/?recipient=${contact.profileUrl?.split('/in/')[1]?.replace('/', '')}`,
      });
    }
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-warrior-dark text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚔️</div>
          <h2 className="text-lg font-bold mb-2">LIWarrior</h2>
          <p className="text-white/50 text-sm">
            When a connection is accepted, a message draft will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warrior-dark text-white">
      {/* Header */}
      <div className="bg-li-blue px-4 py-3">
        <h1 className="text-sm font-bold">LIWarrior — Draft Message</h1>
      </div>

      {/* Contact info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
            {contact.firstName[0]}
          </div>
          <div>
            <h2 className="font-semibold">{contact.fullName}</h2>
            <p className="text-xs text-white/60">{contact.title}</p>
            <p className="text-xs text-white/40">{contact.company}</p>
          </div>
        </div>

        {/* Commonalities */}
        {contact.commonalities && contact.commonalities.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-white/50 mb-1.5">Things in common:</p>
            <div className="flex flex-wrap gap-1.5">
              {contact.commonalities.map((c, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    c.type === commonalityUsed
                      ? 'bg-warrior-gold text-warrior-dark'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {c.type === 'university' && '🎓'}
                  {c.type === 'language' && '🗣️'}
                  {c.type === 'last_name' && '👨‍👩‍👦'}
                  {c.type === 'company' && '🏢'}
                  {c.type === 'location' && '📍'}
                  {c.type === 'volunteer' && '🤝'}
                  {c.type === 'certification' && '📜'}
                  {' '}{c.contactValue}
                  {c.type === commonalityUsed && ' ✓ used'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Draft message */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-white/50">Message draft:</p>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-li-light hover:underline"
          >
            {editing ? 'Preview' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-li-blue"
          />
        ) : (
          <div className="bg-white/5 rounded-lg p-3 text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
            {draft || 'Generating draft...'}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={copyToClipboard}
            className="flex-1 bg-li-blue hover:bg-li-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </button>
        </div>

        <button
          onClick={openChat}
          className="w-full mt-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          💬 Open Chat with {contact.firstName}
        </button>

        <p className="text-xs text-white/30 text-center mt-4">
          Copy the message, paste it into the LinkedIn chat, and send it yourself.
          LIWarrior never sends messages for you.
        </p>
      </div>
    </div>
  );
}
