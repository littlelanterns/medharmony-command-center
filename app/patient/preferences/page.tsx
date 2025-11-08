'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface RecurringBlock {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string;
}

interface OneTimeBlock {
  id?: string;
  block_start: string;
  block_end: string;
  reason: string;
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

export default function AvailabilityPreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Recurring unavailable blocks
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);
  const [newRecurringBlock, setNewRecurringBlock] = useState<RecurringBlock>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '11:00',
    reason: '',
  });

  // One-time blocks
  const [oneTimeBlocks, setOneTimeBlocks] = useState<OneTimeBlock[]>([]);
  const [newOneTimeBlock, setNewOneTimeBlock] = useState<OneTimeBlock>({
    block_start: '',
    block_end: '',
    reason: '',
  });

  // Preferred times
  const [preferredMorning, setPreferredMorning] = useState(false);
  const [preferredAfternoon, setPreferredAfternoon] = useState(false);
  const [preferredEvening, setPreferredEvening] = useState(false);
  const [preferredCustom, setPreferredCustom] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');

  // Notice requirement
  const [hoursNeeded, setHoursNeeded] = useState(2);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadPreferences(userData.id);
    }
  }, []);

  const loadPreferences = async (patientId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from('availability_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true);

    if (data) {
      const recurring: RecurringBlock[] = [];
      const oneTime: OneTimeBlock[] = [];

      data.forEach((pref: any) => {
        if (pref.preference_type === 'recurring_block') {
          recurring.push({
            id: pref.id,
            day_of_week: pref.day_of_week,
            start_time: pref.start_time,
            end_time: pref.end_time,
            reason: pref.preference_data?.reason || '',
          });
        } else if (pref.preference_type === 'one_time_block') {
          oneTime.push({
            id: pref.id,
            block_start: pref.block_start,
            block_end: pref.block_end,
            reason: pref.preference_data?.reason || '',
          });
        } else if (pref.preference_type === 'preferred_time') {
          const times = pref.preference_data?.times || [];
          setPreferredMorning(times.includes('morning'));
          setPreferredAfternoon(times.includes('afternoon'));
          setPreferredEvening(times.includes('evening'));
          if (pref.preference_data?.custom_start && pref.preference_data?.custom_end) {
            setPreferredCustom(true);
            setCustomStartTime(pref.preference_data.custom_start);
            setCustomEndTime(pref.preference_data.custom_end);
          }
        } else if (pref.preference_type === 'notice_requirement') {
          setHoursNeeded(pref.preference_data?.hours_needed || 2);
        }
      });

      setRecurringBlocks(recurring);
      setOneTimeBlocks(oneTime);
    }

    setLoading(false);
  };

  const addRecurringBlock = () => {
    if (newRecurringBlock.reason.trim()) {
      setRecurringBlocks([...recurringBlocks, { ...newRecurringBlock }]);
      setNewRecurringBlock({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '11:00',
        reason: '',
      });
    }
  };

  const removeRecurringBlock = (index: number) => {
    setRecurringBlocks(recurringBlocks.filter((_, i) => i !== index));
  };

  const addOneTimeBlock = () => {
    if (newOneTimeBlock.reason.trim() && newOneTimeBlock.block_start && newOneTimeBlock.block_end) {
      setOneTimeBlocks([...oneTimeBlocks, { ...newOneTimeBlock }]);
      setNewOneTimeBlock({
        block_start: '',
        block_end: '',
        reason: '',
      });
    }
  };

  const removeOneTimeBlock = (index: number) => {
    setOneTimeBlocks(oneTimeBlocks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      // Delete existing preferences
      await supabase
        .from('availability_preferences')
        .delete()
        .eq('patient_id', user.id);

      // Insert recurring blocks
      for (const block of recurringBlocks) {
        await supabase.from('availability_preferences').insert({
          patient_id: user.id,
          preference_type: 'recurring_block',
          day_of_week: block.day_of_week,
          start_time: block.start_time,
          end_time: block.end_time,
          preference_data: { reason: block.reason },
          is_active: true,
        });
      }

      // Insert one-time blocks
      for (const block of oneTimeBlocks) {
        await supabase.from('availability_preferences').insert({
          patient_id: user.id,
          preference_type: 'one_time_block',
          block_start: block.block_start,
          block_end: block.block_end,
          preference_data: { reason: block.reason },
          is_active: true,
        });
      }

      // Insert preferred times
      const preferredTimes = [];
      if (preferredMorning) preferredTimes.push('morning');
      if (preferredAfternoon) preferredTimes.push('afternoon');
      if (preferredEvening) preferredTimes.push('evening');

      if (preferredTimes.length > 0 || preferredCustom) {
        const preferenceData: any = { times: preferredTimes };
        if (preferredCustom) {
          preferenceData.custom_start = customStartTime;
          preferenceData.custom_end = customEndTime;
        }

        await supabase.from('availability_preferences').insert({
          patient_id: user.id,
          preference_type: 'preferred_time',
          preference_data: preferenceData,
          is_active: true,
        });
      }

      // Insert notice requirement
      await supabase.from('availability_preferences').insert({
        patient_id: user.id,
        preference_type: 'notice_requirement',
        preference_data: { hours_needed: hoursNeeded },
        is_active: true,
      });

      alert('Preferences saved successfully!');
      router.push('/patient');
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
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/patient')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">My Availability Preferences</h1>
          <p className="text-white/80 mt-1">Help us schedule appointments that work for you</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        {/* Recurring Unavailable Blocks */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Recurring Unavailable Times</h2>
          <p className="text-gray-600 mb-4">
            Block out times that repeat weekly (e.g., work hours, kids' activities)
          </p>

          {recurringBlocks.length > 0 && (
            <div className="space-y-3 mb-4">
              {recurringBlocks.map((block, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {DAYS_OF_WEEK.find((d) => d.value === block.day_of_week)?.label}s {block.start_time} - {block.end_time}
                    </div>
                    <div className="text-sm text-gray-600">{block.reason}</div>
                  </div>
                  <button
                    onClick={() => removeRecurringBlock(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (e.g., "Kids music class")</label>
              <input
                type="text"
                value={newRecurringBlock.reason}
                onChange={(e) => setNewRecurringBlock({ ...newRecurringBlock, reason: e.target.value })}
                placeholder="Enter reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
              />
            </div>
            <button
              onClick={addRecurringBlock}
              className="btn-primary"
            >
              + Add Recurring Block
            </button>
          </div>
        </div>

        {/* One-Time Blocks */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">One-Time Unavailable Dates</h2>
          <p className="text-gray-600 mb-4">
            Block out specific date ranges (e.g., vacation, business trip)
          </p>

          {oneTimeBlocks.length > 0 && (
            <div className="space-y-3 mb-4">
              {oneTimeBlocks.map((block, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-800">
                      {new Date(block.block_start).toLocaleDateString()} - {new Date(block.block_end).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">{block.reason}</div>
                  </div>
                  <button
                    onClick={() => removeOneTimeBlock(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason (e.g., "Vacation")</label>
              <input
                type="text"
                value={newOneTimeBlock.reason}
                onChange={(e) => setNewOneTimeBlock({ ...newOneTimeBlock, reason: e.target.value })}
                placeholder="Enter reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
              />
            </div>
            <button
              onClick={addOneTimeBlock}
              className="btn-primary"
            >
              + Add One-Time Block
            </button>
          </div>
        </div>

        {/* Preferred Times */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Preferred Times of Day</h2>
          <p className="text-gray-600 mb-4">
            When do you prefer to have appointments? (Select all that apply)
          </p>

          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferredMorning}
                onChange={(e) => setPreferredMorning(e.target.checked)}
                className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
              />
              <span className="ml-3 text-gray-800 font-semibold">Morning (7am - 12pm)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferredAfternoon}
                onChange={(e) => setPreferredAfternoon(e.target.checked)}
                className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
              />
              <span className="ml-3 text-gray-800 font-semibold">Afternoon (12pm - 5pm)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferredEvening}
                onChange={(e) => setPreferredEvening(e.target.checked)}
                className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
              />
              <span className="ml-3 text-gray-800 font-semibold">Evening (5pm - 8pm)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferredCustom}
                onChange={(e) => setPreferredCustom(e.target.checked)}
                className="w-5 h-5 text-[#008080] border-gray-300 rounded focus:ring-[#008080]"
              />
              <span className="ml-3 text-gray-800 font-semibold">Custom Time Range</span>
            </label>

            {preferredCustom && (
              <div className="ml-8 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notice Requirement */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Advance Notice Required</h2>
          <p className="text-gray-600 mb-4">
            How much advance notice do you need for appointments?
          </p>

          <div className="flex items-center gap-6">
            <input
              type="range"
              min="1"
              max="72"
              step="1"
              value={hoursNeeded}
              onChange={(e) => setHoursNeeded(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#008080]"
            />
            <div className="text-2xl font-bold text-[#008080] w-32 text-center">
              {hoursNeeded} {hoursNeeded === 1 ? 'hour' : 'hours'}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/patient')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </main>
    </div>
  );
}
