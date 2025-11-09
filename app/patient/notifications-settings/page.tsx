'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { validatePhoneNumber } from '@/lib/notifications/sms';

interface NotificationPreference {
  notification_type: string;
  send_in_app: boolean;
  send_email: boolean;
  send_sms: boolean;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [voiceCallEnabled, setVoiceCallEnabled] = useState(false);
  const [voiceCallTime, setVoiceCallTime] = useState('anytime');
  const [phoneError, setPhoneError] = useState('');

  const [preferences, setPreferences] = useState<Record<string, NotificationPreference>>({});

  const notificationTypes = [
    { type: 'cancellation_alert', label: 'Cancellation Alerts', description: 'When appointment slots become available' },
    { type: 'appointment_confirmed', label: 'Appointment Confirmations', description: 'When you confirm an appointment' },
    { type: 'appointment_booked', label: 'Appointment Booked', description: 'When a new appointment is scheduled' },
    { type: 'appointment_cancelled', label: 'Cancellations', description: 'When appointments are cancelled' },
    { type: 'time_block_notification', label: 'Provider Unavailability', description: 'When provider blocks time affecting your appointment' },
    { type: 'order_created', label: 'New Orders', description: 'When provider creates a new order for you' },
    { type: 'reminder', label: 'Appointment Reminders', description: 'Reminders before upcoming appointments' },
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    if (userData.id) {
      loadSettings(userData.id);
    }
  }, []);

  const loadSettings = async (userId: string) => {
    setLoading(true);

    // Load user settings
    const { data: userData } = await supabase
      .from('users')
      .select('phone_number, email_notifications_enabled, sms_notifications_enabled')
      .eq('id', userId)
      .single();

    if (userData) {
      setPhoneNumber(userData.phone_number || '');
      setEmailEnabled(userData.email_notifications_enabled ?? true);
      setSmsEnabled(userData.sms_notifications_enabled ?? false);

      // Voice call settings (stored in patient_profiles for now)
      const { data: profile } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if user prefers voice calls (indicated by SMS disabled and has phone)
      if (profile && userData.phone_number && !userData.sms_notifications_enabled && !userData.email_notifications_enabled) {
        setVoiceCallEnabled(true);
      }
    }

    // Load notification preferences
    const { data: prefsData } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (prefsData) {
      const prefsMap: Record<string, NotificationPreference> = {};
      prefsData.forEach((pref: any) => {
        prefsMap[pref.notification_type] = pref;
      });
      setPreferences(prefsMap);
    }

    setLoading(false);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setPhoneError('');
  };

  const handlePreferenceChange = (
    type: string,
    channel: 'send_in_app' | 'send_email' | 'send_sms',
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        notification_type: type,
        [channel]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      // Validate phone number if SMS is enabled
      if (smsEnabled && phoneNumber) {
        const validation = validatePhoneNumber(phoneNumber);
        if (!validation.valid) {
          setPhoneError(validation.error || 'Invalid phone number');
          setSaving(false);
          return;
        }
      }

      // Update user settings
      await supabase
        .from('users')
        .update({
          phone_number: phoneNumber || null,
          email_notifications_enabled: emailEnabled,
          sms_notifications_enabled: smsEnabled,
        })
        .eq('id', user.id);

      // Update each notification preference
      for (const [type, pref] of Object.entries(preferences)) {
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user.id,
            notification_type: type,
            send_in_app: pref.send_in_app,
            send_email: pref.send_email,
            send_sms: pref.send_sms,
          });
      }

      alert('✅ Notification settings saved successfully!');
      router.push('/patient');

    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading settings...</div>
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
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-white/80 mt-1">Manage how you receive notifications</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">

          {/* Master Toggles */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notification Channels</h2>

            {/* In-App (always on) */}
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">In-App Notifications</div>
                  <div className="text-sm text-gray-600">Bell icon in header (always enabled)</div>
                </div>
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Email */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications via email</div>
                </div>
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="w-6 h-6 text-[#008080] rounded"
                />
              </label>
            </div>

            {/* SMS */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center justify-between cursor-pointer mb-4">
                <div>
                  <div className="font-semibold text-gray-900">SMS Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications via text message</div>
                </div>
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="w-6 h-6 text-[#008080] rounded"
                />
              </label>

              {smsEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#008080] ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {phoneError && (
                    <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your phone number to receive SMS notifications
                  </p>
                </div>
              )}
            </div>

            {/* Voice Calls */}
            <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <label className="flex items-center justify-between cursor-pointer mb-4">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    📞 Voice Call Notifications
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="text-sm text-gray-600">Receive important notifications via phone call</div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceCallEnabled}
                  onChange={(e) => setVoiceCallEnabled(e.target.checked)}
                  className="w-6 h-6 text-purple-600 rounded"
                />
              </label>

              {voiceCallEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(555) 123-4567"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                        phoneError ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {phoneError && (
                      <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Call Time
                    </label>
                    <select
                      value={voiceCallTime}
                      onChange={(e) => setVoiceCallTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 8 PM)</option>
                      <option value="anytime">Anytime (8 AM - 8 PM)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      We'll try to call during your preferred time
                    </p>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">When you'll receive calls:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✅ Appointment confirmations (if enabled below)</li>
                      <li>✅ Urgent appointment changes</li>
                      <li>✅ Cancellation opportunities</li>
                      <li>✅ Appointment reminders (24 hours before)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Coming in Phase 2:</strong> AI voice calls powered by advanced speech synthesis.
                      Calls will be clear, professional, and include the ability to reschedule via voice command.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Per-Type Preferences */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Notification Types</h2>
            <p className="text-gray-600 mb-6">Choose how you want to receive each type of notification</p>

            <div className="space-y-4">
              {notificationTypes.map((notif) => {
                const pref = preferences[notif.type] || {
                  send_in_app: true,
                  send_email: true,
                  send_sms: false,
                };

                return (
                  <div key={notif.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">{notif.label}</h3>
                      <p className="text-sm text-gray-600">{notif.description}</p>
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.send_in_app}
                          onChange={(e) => handlePreferenceChange(notif.type, 'send_in_app', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">In-App</span>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.send_email}
                          onChange={(e) => handlePreferenceChange(notif.type, 'send_email', e.target.checked)}
                          disabled={!emailEnabled}
                          className="mr-2 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.send_sms}
                          onChange={(e) => handlePreferenceChange(notif.type, 'send_sms', e.target.checked)}
                          disabled={!smsEnabled}
                          className="mr-2 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">SMS</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mock Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <div className="flex items-start">
              <span className="text-2xl mr-3">ℹ️</span>
              <div>
                <h4 className="font-bold text-yellow-900 mb-1">Demo Mode</h4>
                <p className="text-sm text-yellow-800">
                  Email and SMS notifications are currently in <strong>mock mode</strong> and will be logged to the console instead of being sent. To enable real notifications, add SendGrid and Twilio credentials to your environment variables.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              onClick={() => router.push('/patient')}
              className="px-8 py-3 border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
