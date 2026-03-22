import React, { useEffect, useState } from 'react';
import type { MessageTemplate } from '@/types';

export default function Templates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_TEMPLATES' }, (res) => {
      if (Array.isArray(res)) setTemplates(res);
    });
  }, []);

  const filtered = templates.filter(
    (t) => selectedType === 'all' || t.type === selectedType
  );

  const startEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setEditBody(template.body);
  };

  const saveEdit = (template: MessageTemplate) => {
    const updated = { ...template, body: editBody };
    chrome.runtime.sendMessage({ type: 'SAVE_TEMPLATE', data: updated }, () => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === template.id ? updated : t))
      );
      setEditingId(null);
    });
  };

  const typeLabels: Record<string, string> = {
    connection_note: 'Connection Notes',
    initial_message: 'Initial Messages',
    follow_up: 'Follow-Ups',
    nudge: 'Final Check-Ins',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Message Templates</h2>
        <p className="text-gray-500 mt-1">
          Edit templates to match your voice. Variables like {'{firstName}'} get replaced automatically.
        </p>
      </div>

      {/* Available variables */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Available Variables</h3>
        <div className="flex flex-wrap gap-2">
          {['{firstName}', '{lastName}', '{company}', '{department}', '{sharedValue}', '{icebreaker}', '{calendarLink}'].map((v) => (
            <code key={v} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedType === 'all' ? 'bg-li-blue text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          All
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${selectedType === key ? 'bg-li-blue text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {filtered.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">
                {typeLabels[template.type] || template.type}
              </span>
              {template.commonalityType !== 'none' && (
                <span className="bg-warrior-gold/15 text-warrior-gold px-2 py-0.5 rounded text-xs font-medium">
                  {template.commonalityType}
                </span>
              )}
              {template.timesUsed > 0 && (
                <span className="text-xs text-gray-400 ml-auto">
                  Used {template.timesUsed}x
                  {template.repliesReceived > 0 &&
                    ` · ${Math.round((template.repliesReceived / template.timesUsed) * 100)}% reply rate`}
                </span>
              )}
            </div>

            {editingId === template.id ? (
              <div>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => saveEdit(template)}
                    className="bg-li-blue text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                  {template.body}
                </p>
                <button
                  onClick={() => startEdit(template)}
                  className="mt-2 text-li-blue text-xs font-medium hover:underline"
                >
                  Edit Template
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
