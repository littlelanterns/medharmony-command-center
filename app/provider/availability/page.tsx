'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import BlockTimeModal from '@/components/provider/BlockTimeModal';

interface Schedule {
  id?: string;
  location: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  staff_available: string[];
  appointment_duration_minutes: number;
  max_appointments_per_slot: number;
  notes: string;
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

export default function ProviderAvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [locations, setLocations] = useState<string[]>(['MedHarmony Labs - Main St', 'MedHarmony Labs - Oak Ave', 'MedHarmony Labs - Riverside']);
  const [newLocation, setNewLocation] = useState('');
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);

  const [editingSchedule, setEditingSchedule] = useState<Schedule>({
    location: 'MedHarmony Labs - Main St',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '17:00',
    staff_available: [],
    appointment_duration_minutes: 30,
    max_appointments_per_slot: 1,
    notes: ''
  });

  const [newStaff, setNewStaff] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadSchedules(userData.id);
    }
  }, []);

  const loadSchedules = async (providerId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (data) {
      setSchedules(data);
    } else if (error) {
      console.error('Error loading schedules:', error);
    }

    setLoading(false);
  };

  const addSchedule = async () => {
    if (!user?.id) return;

    // Validate
    if (editingSchedule.staff_available.length === 0) {
      alert('Please add at least one staff member');
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('provider_schedules')
        .insert({
          provider_id: user.id,
          location: editingSchedule.location,
          day_of_week: editingSchedule.day_of_week,
          start_time: editingSchedule.start_time,
          end_time: editingSchedule.end_time,
          staff_available: editingSchedule.staff_available,
          appointment_duration_minutes: editingSchedule.appointment_duration_minutes,
          max_appointments_per_slot: editingSchedule.max_appointments_per_slot,
          notes: editingSchedule.notes,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding schedule:', error);
        alert('Error adding schedule: ' + error.message);
      } else {
        setSchedules([...schedules, data]);
        // Reset form
        setEditingSchedule({
          location: 'MedHarmony Labs - Main St',
          day_of_week: 1,
          start_time: '08:00',
          end_time: '17:00',
          staff_available: [],
          appointment_duration_minutes: 30,
          max_appointments_per_slot: 1,
          notes: ''
        });
        alert('Schedule added successfully!');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const { error } = await supabase
      .from('provider_schedules')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      setSchedules(schedules.filter(s => s.id !== id));
      alert('Schedule deleted');
    } else {
      alert('Error deleting schedule');
    }
  };

  const addStaffToSchedule = () => {
    if (newStaff.trim() && !editingSchedule.staff_available.includes(newStaff.trim())) {
      setEditingSchedule({
        ...editingSchedule,
        staff_available: [...editingSchedule.staff_available, newStaff.trim()]
      });
      setNewStaff('');
    }
  };

  const removeStaff = (staff: string) => {
    setEditingSchedule({
      ...editingSchedule,
      staff_available: editingSchedule.staff_available.filter(s => s !== staff)
    });
  };

  const addNewLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setEditingSchedule({ ...editingSchedule, location: newLocation.trim() });
      setNewLocation('');
    }
  };

  // Group schedules by location and day for display
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const key = `${schedule.location}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading availability...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/provider')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Manage Your Availability</h1>
          <p className="text-white/80 mt-1">Define when and where you're available for appointments</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Block Time Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowBlockTimeModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg hover:from-red-600 hover:to-orange-600 transition shadow-lg"
          >
            🚫 Block Time (Vacation, Sick Day, etc.)
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Mark yourself unavailable. Affected patients will be automatically notified to reschedule.
          </p>
        </div>

        {/* Current Schedules Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Current Availability</h2>

          {Object.keys(groupedSchedules).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No schedules defined yet</p>
              <p className="text-sm">Add your first availability slot below to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchedules).map(([location, locationSchedules]) => (
                <div key={location} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-lg text-[#002C5F] mb-3">{location}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {locationSchedules.map((schedule) => (
                      <div key={schedule.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-[#008080]">
                            {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                          </span>
                          <button
                            onClick={() => deleteSchedule(schedule.id!)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                        </div>
                        <div className="text-xs text-gray-600">
                          <div className="font-semibold mb-1">Staff:</div>
                          {schedule.staff_available.map(staff => (
                            <div key={staff} className="ml-2">• {staff}</div>
                          ))}
                        </div>
                        {schedule.notes && (
                          <div className="text-xs text-gray-500 mt-2 italic">
                            {schedule.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import from Existing System */}
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                Connect to Your Existing Scheduling System
              </h3>
              <p className="text-gray-700 mb-4">
                Already using Epic, Cerner, Google Calendar, or another system? Import your schedule automatically instead of manual entry.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/provider/availability/import')}
                  className="px-6 py-3 bg-[#008080] text-white font-semibold rounded-lg hover:bg-[#006666] transition"
                >
                  View Integration Options
                </button>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>Supports: FHIR, Google Calendar, Outlook, CSV Import, and more</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Schedule */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Or Add Manually</h2>

          <div className="space-y-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <div className="flex gap-2">
                <select
                  value={editingSchedule.location}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, location: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Add new location..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
                <button
                  onClick={addNewLocation}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Location
                </button>
              </div>
            </div>

            {/* Day and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                <select
                  value={editingSchedule.day_of_week}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={editingSchedule.start_time}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={editingSchedule.end_time}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>
            </div>

            {/* Staff Available */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Available</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStaffToSchedule()}
                  placeholder="e.g., Lisa Chen, Phlebotomist"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
                <button
                  onClick={addStaffToSchedule}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Staff
                </button>
              </div>
              {editingSchedule.staff_available.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editingSchedule.staff_available.map(staff => (
                    <span
                      key={staff}
                      className="inline-flex items-center px-3 py-1 bg-[#008080] text-white rounded-full text-sm"
                    >
                      {staff}
                      <button
                        onClick={() => removeStaff(staff)}
                        className="ml-2 text-white/80 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Appointment Duration (minutes)
                </label>
                <input
                  type="number"
                  value={editingSchedule.appointment_duration_minutes}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, appointment_duration_minutes: parseInt(e.target.value) })}
                  min="15"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Concurrent Appointments
                </label>
                <input
                  type="number"
                  value={editingSchedule.max_appointments_per_slot}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, max_appointments_per_slot: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
              <textarea
                value={editingSchedule.notes}
                onChange={(e) => setEditingSchedule({ ...editingSchedule, notes: e.target.value })}
                placeholder="e.g., Experienced phlebotomists available, near hospital"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={addSchedule}
              disabled={saving}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#50C878] to-[#008080] text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {saving ? 'Adding...' : '+ Add Availability Slot'}
            </button>
          </div>
        </div>
      </main>

      {/* Block Time Modal */}
      {showBlockTimeModal && (
        <BlockTimeModal
          providerId={user?.id || ''}
          onClose={() => setShowBlockTimeModal(false)}
          onSuccess={() => {
            // Optionally reload schedules or show confirmation
            console.log('Time blocked successfully');
          }}
        />
      )}
    </div>
  );
}
