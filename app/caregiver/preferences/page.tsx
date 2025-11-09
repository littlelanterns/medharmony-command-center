'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface FamilyMember {
  id: string;
  full_name: string;
  relationship_type: string;
}

interface RecurringBlock {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string;
  affected_people: string[]; // IDs of people this block applies to (including caregiver)
}

interface OneTimeBlock {
  id?: string;
  block_start: string;
  block_end: string;
  reason: string;
  affected_people: string[]; // IDs of people this block applies to
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function CaregiverAvailabilityPreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Recurring unavailable blocks
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);
  const [newRecurringBlock, setNewRecurringBlock] = useState<RecurringBlock>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '11:00',
    reason: '',
    affected_people: [],
  });

  // One-time blocks
  const [oneTimeBlocks, setOneTimeBlocks] = useState<OneTimeBlock[]>([]);
  const [newOneTimeBlock, setNewOneTimeBlock] = useState<OneTimeBlock>({
    block_start: '',
    block_end: '',
    reason: '',
    affected_people: [],
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadFamilyMembers(userData.id);
      loadPreferences(userData.id);
    }
  }, []);

  const loadFamilyMembers = async (caregiverId: string) => {
    const { data: relationships } = await supabase
      .from('caregiver_relationships')
      .select(`
        patient_id,
        relationship_type,
        patient:users!caregiver_relationships_patient_id_fkey (
          id,
          full_name
        )
      `)
      .eq('caregiver_id', caregiverId);

    if (relationships) {
      const members: FamilyMember[] = relationships.map((rel: any) => ({
        id: rel.patient.id,
        full_name: rel.patient.full_name,
        relationship_type: rel.relationship_type,
      }));

      setFamilyMembers(members);

      // Auto-select all people (including caregiver) for new blocks
      const allPeopleIds = [caregiverId, ...members.map(m => m.id)];
      setNewRecurringBlock(prev => ({ ...prev, affected_people: allPeopleIds }));
      setNewOneTimeBlock(prev => ({ ...prev, affected_people: allPeopleIds }));
    }
  };

  const loadPreferences = async (caregiverId: string) => {
    setLoading(true);

    // Load preferences for caregiver and all family members
    const familyMemberIds = familyMembers.map(m => m.id);
    const allIds = [caregiverId, ...familyMemberIds];

    const { data, error } = await supabase
      .from('availability_preferences')
      .select('*')
      .in('patient_id', allIds)
      .eq('is_active', true);

    if (data) {
      // Group preferences by block (same day/time/reason = same block)
      const recurringMap = new Map<string, RecurringBlock>();
      const oneTimeMap = new Map<string, OneTimeBlock>();

      data.forEach((pref: any) => {
        if (pref.preference_type === 'recurring_block') {
          const key = `${pref.day_of_week}-${pref.start_time}-${pref.end_time}-${pref.preference_data?.reason}`;

          if (recurringMap.has(key)) {
            // Add this person to existing block
            recurringMap.get(key)!.affected_people.push(pref.patient_id);
          } else {
            // Create new block
            recurringMap.set(key, {
              id: pref.id,
              day_of_week: pref.day_of_week,
              start_time: pref.start_time,
              end_time: pref.end_time,
              reason: pref.preference_data?.reason || '',
              affected_people: [pref.patient_id],
            });
          }
        } else if (pref.preference_type === 'one_time_block') {
          const key = `${pref.block_start}-${pref.block_end}-${pref.preference_data?.reason}`;

          if (oneTimeMap.has(key)) {
            oneTimeMap.get(key)!.affected_people.push(pref.patient_id);
          } else {
            oneTimeMap.set(key, {
              id: pref.id,
              block_start: pref.block_start,
              block_end: pref.block_end,
              reason: pref.preference_data?.reason || '',
              affected_people: [pref.patient_id],
            });
          }
        }
      });

      setRecurringBlocks(Array.from(recurringMap.values()));
      setOneTimeBlocks(Array.from(oneTimeMap.values()));
    }

    setLoading(false);
  };

  const togglePersonInNewRecurring = (personId: string) => {
    setNewRecurringBlock(prev => ({
      ...prev,
      affected_people: prev.affected_people.includes(personId)
        ? prev.affected_people.filter(id => id !== personId)
        : [...prev.affected_people, personId],
    }));
  };

  const togglePersonInNewOneTime = (personId: string) => {
    setNewOneTimeBlock(prev => ({
      ...prev,
      affected_people: prev.affected_people.includes(personId)
        ? prev.affected_people.filter(id => id !== personId)
        : [...prev.affected_people, personId],
    }));
  };

  const addRecurringBlock = () => {
    if (newRecurringBlock.reason.trim() && newRecurringBlock.affected_people.length > 0) {
      setRecurringBlocks([...recurringBlocks, { ...newRecurringBlock }]);

      // Reset with all people selected
      const allPeopleIds = [user.id, ...familyMembers.map(m => m.id)];
      setNewRecurringBlock({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '11:00',
        reason: '',
        affected_people: allPeopleIds,
      });
    }
  };

  const removeRecurringBlock = (index: number) => {
    setRecurringBlocks(recurringBlocks.filter((_, i) => i !== index));
  };

  const addOneTimeBlock = () => {
    if (newOneTimeBlock.reason.trim() && newOneTimeBlock.block_start && newOneTimeBlock.block_end && newOneTimeBlock.affected_people.length > 0) {
      setOneTimeBlocks([...oneTimeBlocks, { ...newOneTimeBlock }]);

      // Reset with all people selected
      const allPeopleIds = [user.id, ...familyMembers.map(m => m.id)];
      setNewOneTimeBlock({
        block_start: '',
        block_end: '',
        reason: '',
        affected_people: allPeopleIds,
      });
    }
  };

  const removeOneTimeBlock = (index: number) => {
    setOneTimeBlocks(oneTimeBlocks.filter((_, i) => i !== index));
  };

  const getPersonName = (personId: string) => {
    if (personId === user?.id) return `${user.name} (You)`;
    return familyMembers.find(m => m.id === personId)?.full_name || 'Unknown';
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      // Delete all existing preferences for caregiver and family members
      const allIds = [user.id, ...familyMembers.map(m => m.id)];
      await supabase
        .from('availability_preferences')
        .delete()
        .in('patient_id', allIds);

      // Insert recurring blocks for each affected person
      for (const block of recurringBlocks) {
        for (const personId of block.affected_people) {
          await supabase.from('availability_preferences').insert({
            patient_id: personId,
            preference_type: 'recurring_block',
            day_of_week: block.day_of_week,
            start_time: block.start_time,
            end_time: block.end_time,
            preference_data: { reason: block.reason },
            is_active: true,
          });
        }
      }

      // Insert one-time blocks for each affected person
      for (const block of oneTimeBlocks) {
        for (const personId of block.affected_people) {
          await supabase.from('availability_preferences').insert({
            patient_id: personId,
            preference_type: 'one_time_block',
            block_start: block.block_start,
            block_end: block.block_end,
            preference_data: { reason: block.reason },
            is_active: true,
          });
        }
      }

      alert('Family availability preferences saved successfully!');
      router.push('/caregiver');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#008080] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/caregiver')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Family Manager
          </button>
          <h1 className="text-3xl font-bold">Family Availability Preferences</h1>
          <p className="text-white/80 mt-1">Manage scheduling availability for you and your family members</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        {/* Recurring Unavailable Blocks */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Recurring Unavailable Times</h2>
          <p className="text-gray-600 mb-4">
            Block out times that repeat weekly for you or your family members
          </p>

          {recurringBlocks.length > 0 && (
            <div className="space-y-3 mb-4">
              {recurringBlocks.map((block, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#008080]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {DAYS_OF_WEEK.find((d) => d.value === block.day_of_week)?.label}s {block.start_time} - {block.end_time}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{block.reason}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {block.affected_people.map(personId => (
                          <span key={personId} className="bg-[#008080] text-white px-2 py-1 rounded-full text-xs">
                            {getPersonName(personId)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removeRecurringBlock(index)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                <select
                  value={newRecurringBlock.day_of_week}
                  onChange={(e) => setNewRecurringBlock({ ...newRecurringBlock, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newRecurringBlock.start_time}
                    onChange={(e) => setNewRecurringBlock({ ...newRecurringBlock, start_time: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={newRecurringBlock.end_time}
                    onChange={(e) => setNewRecurringBlock({ ...newRecurringBlock, end_time: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (e.g., "Margaret's bridge club")</label>
              <input
                type="text"
                value={newRecurringBlock.reason}
                onChange={(e) => setNewRecurringBlock({ ...newRecurringBlock, reason: e.target.value })}
                placeholder="Enter reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
              />
            </div>

            {/* Who is unavailable */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Who is unavailable during this time?</label>
              <p className="text-xs text-gray-600 mb-3">By default, everyone is selected. Uncheck anyone who IS available during this time.</p>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRecurringBlock.affected_people.includes(user?.id || '')}
                    onChange={() => togglePersonInNewRecurring(user?.id || '')}
                    className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
                  />
                  <span className="ml-3 text-gray-800 font-semibold">{user?.name} (You - Caregiver)</span>
                </label>
                {familyMembers.map(member => (
                  <label key={member.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRecurringBlock.affected_people.includes(member.id)}
                      onChange={() => togglePersonInNewRecurring(member.id)}
                      className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
                    />
                    <span className="ml-3 text-gray-800">
                      {member.full_name} <span className="text-sm text-gray-500">({member.relationship_type})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addRecurringBlock}
              disabled={!newRecurringBlock.reason.trim() || newRecurringBlock.affected_people.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Recurring Block
            </button>
          </div>
        </div>

        {/* One-Time Blocks */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">One-Time Unavailable Dates</h2>
          <p className="text-gray-600 mb-4">
            Block out specific date ranges for you or your family members
          </p>

          {oneTimeBlocks.length > 0 && (
            <div className="space-y-3 mb-4">
              {oneTimeBlocks.map((block, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#008080]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {new Date(block.block_start).toLocaleDateString()} - {new Date(block.block_end).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{block.reason}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {block.affected_people.map(personId => (
                          <span key={personId} className="bg-[#008080] text-white px-2 py-1 rounded-full text-xs">
                            {getPersonName(personId)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removeOneTimeBlock(index)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newOneTimeBlock.block_start}
                  onChange={(e) => setNewOneTimeBlock({ ...newOneTimeBlock, block_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newOneTimeBlock.block_end}
                  onChange={(e) => setNewOneTimeBlock({ ...newOneTimeBlock, block_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (e.g., "Family vacation")</label>
              <input
                type="text"
                value={newOneTimeBlock.reason}
                onChange={(e) => setNewOneTimeBlock({ ...newOneTimeBlock, reason: e.target.value })}
                placeholder="Enter reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
              />
            </div>

            {/* Who is unavailable */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Who is unavailable during this time?</label>
              <p className="text-xs text-gray-600 mb-3">By default, everyone is selected. Uncheck anyone who IS available during this time.</p>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newOneTimeBlock.affected_people.includes(user?.id || '')}
                    onChange={() => togglePersonInNewOneTime(user?.id || '')}
                    className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
                  />
                  <span className="ml-3 text-gray-800 font-semibold">{user?.name} (You - Caregiver)</span>
                </label>
                {familyMembers.map(member => (
                  <label key={member.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newOneTimeBlock.affected_people.includes(member.id)}
                      onChange={() => togglePersonInNewOneTime(member.id)}
                      className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
                    />
                    <span className="ml-3 text-gray-800">
                      {member.full_name} <span className="text-sm text-gray-500">({member.relationship_type})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={addOneTimeBlock}
              disabled={!newOneTimeBlock.reason.trim() || !newOneTimeBlock.block_start || !newOneTimeBlock.block_end || newOneTimeBlock.affected_people.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add One-Time Block
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/caregiver')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Family Preferences'}
          </button>
        </div>
      </main>
    </div>
  );
}
