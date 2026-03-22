import React, { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';

export default function Profile() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    headline: '',
    universities: [],
    languages: [],
    currentLocation: '',
    previousLocations: [],
    companies: [],
    certifications: [],
    volunteerOrgs: [],
    targetRoles: [],
    targetLevel: '',
    calendarLink: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_USER_PROFILE' }, (res) => {
      if (res && res.id) {
        setProfile(res);
      }
    });
  }, []);

  const save = () => {
    chrome.runtime.sendMessage({ type: 'SAVE_USER_PROFILE', data: profile }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const updateField = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: string, value: string) => {
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    setProfile((prev) => ({ ...prev, [field]: items }));
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
        <p className="text-gray-500 mt-1">
          This data powers the Commonality Engine — it finds shared connections between you and
          your target contacts to make messages feel personal. All data stays 100% local.
        </p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={profile.firstName || ''} onChange={(v) => updateField('firstName', v)} />
          <Field label="Last Name" value={profile.lastName || ''} onChange={(v) => updateField('lastName', v)} />
        </div>

        <Field label="Headline" value={profile.headline || ''} onChange={(v) => updateField('headline', v)} placeholder="e.g., Software Engineer | CS @ UT Austin" />

        <Field label="Current Location" value={profile.currentLocation || ''} onChange={(v) => updateField('currentLocation', v)} placeholder="e.g., Austin, TX" />

        <ArrayField
          label="Universities"
          hint="Comma-separated"
          value={(profile.universities || []).join(', ')}
          onChange={(v) => updateArrayField('universities', v)}
          placeholder="e.g., UT Austin, Rice University"
        />

        <ArrayField
          label="Languages (besides English)"
          hint="Comma-separated"
          value={(profile.languages || []).join(', ')}
          onChange={(v) => updateArrayField('languages', v)}
          placeholder="e.g., Spanish, Portuguese"
        />

        <ArrayField
          label="Current + Past Companies"
          hint="Comma-separated"
          value={(profile.companies || []).join(', ')}
          onChange={(v) => updateArrayField('companies', v)}
          placeholder="e.g., Google, Deloitte, Startup XYZ"
        />

        <ArrayField
          label="Certifications"
          hint="Comma-separated"
          value={(profile.certifications || []).join(', ')}
          onChange={(v) => updateArrayField('certifications', v)}
          placeholder="e.g., AWS Solutions Architect, PMP"
        />

        <ArrayField
          label="Volunteer Organizations"
          hint="Comma-separated"
          value={(profile.volunteerOrgs || []).join(', ')}
          onChange={(v) => updateArrayField('volunteerOrgs', v)}
          placeholder="e.g., Girls Who Code, Habitat for Humanity"
        />

        <ArrayField
          label="Target Roles"
          hint="Comma-separated"
          value={(profile.targetRoles || []).join(', ')}
          onChange={(v) => updateArrayField('targetRoles', v)}
          placeholder="e.g., Software Engineer, Product Manager"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Level</label>
          <select
            value={profile.targetLevel || ''}
            onChange={(e) => updateField('targetLevel', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
          >
            <option value="">Select...</option>
            <option value="intern">Intern</option>
            <option value="new_grad">New Grad / Entry Level</option>
            <option value="mid">Mid-Level (2-5 years)</option>
            <option value="senior">Senior (5+ years)</option>
          </select>
        </div>

        <Field
          label="Calendar Link (optional)"
          value={profile.calendarLink || ''}
          onChange={(v) => updateField('calendarLink', v)}
          placeholder="e.g., https://calendly.com/your-link"
        />

        <button
          onClick={save}
          className="w-full bg-li-blue text-white px-4 py-2.5 rounded-lg font-medium hover:bg-li-dark transition-colors"
        >
          {saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
      />
    </div>
  );
}

function ArrayField({ label, hint, value, onChange, placeholder }: {
  label: string; hint: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-gray-400 font-normal">({hint})</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-li-blue"
      />
    </div>
  );
}
