'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportAvailabilityPage() {
  const router = useRouter();
  const [importMethod, setImportMethod] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const integrationOptions = [
    {
      id: 'fhir',
      name: 'EHR System (FHIR)',
      description: 'Connect to Epic, Cerner, Athenahealth, or other FHIR-compatible EHR systems',
      icon: '🏥',
      status: 'Available',
      platforms: ['Epic', 'Cerner/Oracle Health', 'Athenahealth', 'eClinicalWorks']
    },
    {
      id: 'google',
      name: 'Google Calendar',
      description: 'Sync your Google Calendar work schedule automatically',
      icon: '📅',
      status: 'Available',
      platforms: ['Google Workspace', 'Personal Google Calendar']
    },
    {
      id: 'microsoft',
      name: 'Microsoft Outlook/Office 365',
      description: 'Connect your Outlook calendar for automatic sync',
      icon: '📧',
      status: 'Available',
      platforms: ['Office 365', 'Outlook.com', 'Exchange Server']
    },
    {
      id: 'practice',
      name: 'Practice Management System',
      description: 'Import from Kareo, DrChrono, SimplePractice, or similar systems',
      icon: '💼',
      status: 'Available',
      platforms: ['Kareo', 'DrChrono', 'SimplePractice', 'NextGen']
    },
    {
      id: 'csv',
      name: 'CSV/Excel Import',
      description: 'Upload a CSV or Excel file with your schedule',
      icon: '📊',
      status: 'Available',
      platforms: ['Excel', 'Google Sheets', 'Any CSV']
    },
    {
      id: 'ical',
      name: 'iCal/CalDAV',
      description: 'Import from any calendar system supporting iCal format',
      icon: '🔗',
      status: 'Available',
      platforms: ['Apple Calendar', 'Any CalDAV server']
    }
  ];

  const handleCSVImport = async () => {
    if (!csvFile) return;

    setImporting(true);

    // In production, this would parse the CSV and create schedules
    // For now, just show a demo message
    setTimeout(() => {
      alert('CSV import functionality would parse your file and create availability schedules. Example CSV format:\n\nLocation,Day,StartTime,EndTime,Staff\n"Main St",Monday,08:00,17:00,"Dr. Smith"\n"Main St",Tuesday,08:00,17:00,"Dr. Smith"');
      setImporting(false);
    }, 1000);
  };

  const handleIntegrationConnect = (integrationId: string) => {
    setImportMethod(integrationId);

    // Show architecture explanation for each
    const explanations: Record<string, string> = {
      fhir: `FHIR Integration Architecture:

1. OAuth 2.0 Authentication
   - Provider authorizes MedHarmony to access their EHR
   - Secure token exchange with Epic/Cerner/etc.

2. Data Sync
   - Pull /Schedule and /Slot resources
   - Map to our provider_schedules table
   - Sync every 1-6 hours (configurable)

3. Two-Way Booking
   - Patient books in MedHarmony
   - Create /Appointment in their EHR
   - Updates flow both directions

4. Security
   - HIPAA-compliant encryption
   - Audit logs of all access
   - Token refresh & expiration

Required: EHR system admin approval + FHIR API credentials`,

      google: `Google Calendar Integration:

1. OAuth 2.0 with Google
   - Provider signs in with Google account
   - Grant calendar read/write access

2. Calendar Sync
   - Read "Busy" blocks as unavailable
   - Free blocks = available for appointments
   - Respect working hours

3. Booking Flow
   - Patient books → create event in Google Calendar
   - Include patient name, order details
   - Send calendar invite automatically

4. Real-time Updates
   - If provider blocks time in Google → auto-updates availability
   - If appointment cancelled → removes from Google Calendar

Implementation: 1-2 weeks with Google Calendar API`,

      microsoft: `Microsoft Outlook/Office 365 Integration:

1. Microsoft Graph API Authentication
   - Provider signs in with Microsoft account
   - OAuth 2.0 authorization

2. Calendar Sync
   - Read Outlook calendar availability
   - Sync with provider_schedules table
   - Respect working hours and time zones

3. Booking Integration
   - Create Outlook events when patients book
   - Send meeting invites with Teams link option
   - Sync cancellations/reschedules

4. Enterprise Features
   - Support for Exchange Server
   - Distribution list notifications
   - Room/resource booking

Implementation: 1-2 weeks with Microsoft Graph API`,

      practice: `Practice Management System Integration:

Common Systems:
- Kareo (REST API)
- DrChrono (API + OAuth)
- SimplePractice (API access)
- NextGen (HL7/FHIR)

Generic Approach:
1. API Authentication per system
2. Pull provider schedules
3. Map to our data model
4. Sync appointments back

Each system requires custom integration:
- 2-4 weeks per system
- Need API credentials from practice
- Test environment required

Best Practice: Start with 1-2 most common systems`,

      csv: `CSV Import Specification:

Required Columns:
- Location (text)
- Day (Monday-Sunday or 0-6)
- StartTime (HH:MM format)
- EndTime (HH:MM format)
- Staff (comma-separated names)

Optional Columns:
- AppointmentDuration (minutes)
- MaxConcurrent (number)
- Notes (text)

Example CSV:
Location,Day,StartTime,EndTime,Staff,Notes
"Main St Lab",Monday,08:00,17:00,"Lisa Chen,Mark Johnson","Primary location"
"Main St Lab",Tuesday,08:00,17:00,"Lisa Chen,Mark Johnson","Primary location"
"Oak Ave Lab",Monday,09:00,15:00,"Amy Wu","Satellite office"

Import Process:
1. Upload CSV file
2. Preview parsed data
3. Confirm import
4. Schedules created automatically

Download template: [Generate Template Button]`,

      ical: `iCal/CalDAV Integration:

1. Get Calendar URL
   - Provider provides their iCal feed URL
   - Most calendar apps support this

2. Parse iCal Format
   - Read VEVENT components
   - Identify busy/free times
   - Extract location and notes

3. Continuous Sync
   - Poll iCal feed every hour
   - Update availability automatically
   - Handle recurring events

4. Limitations
   - Usually read-only (can't write back)
   - Less detailed than API integrations
   - Good for one-way sync

Use Cases:
- Apple Calendar users
- Self-hosted calendar systems
- Legacy systems without APIs`
    };

    alert(explanations[integrationId] || 'Integration details coming soon');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push('/provider/availability')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Availability
          </button>
          <h1 className="text-3xl font-bold">Import Schedule from Existing System</h1>
          <p className="text-white/80 mt-1">Connect your EHR, calendar, or practice management system</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Integration Options */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Available Integration Methods</h2>
          <p className="text-gray-600 mb-6">
            Choose how you want to import your availability. We support multiple integration methods to work with your existing systems.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrationOptions.map((option) => (
              <div
                key={option.id}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-[#008080] hover:shadow-md transition cursor-pointer"
                onClick={() => handleIntegrationConnect(option.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{option.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{option.name}</h3>
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {option.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                <div className="text-xs text-gray-500">
                  <div className="font-semibold mb-1">Supports:</div>
                  {option.platforms.map((platform, idx) => (
                    <div key={idx} className="ml-2">• {platform}</div>
                  ))}
                </div>

                <button className="mt-4 w-full px-4 py-2 bg-[#008080] text-white font-semibold rounded-lg hover:bg-[#006666] transition">
                  Connect {option.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏗️ How Integration Works</h3>

          <div className="space-y-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-[#002C5F] mb-2">1. One-Time Setup (Provider)</h4>
              <p className="text-gray-700">
                Authorize MedHarmony to access your existing scheduling system. This is a secure OAuth 2.0 process - we never see your password.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-[#002C5F] mb-2">2. Automatic Sync (Background)</h4>
              <p className="text-gray-700">
                Our system pulls your schedule every 1-6 hours (configurable). When you add/remove hours in your EHR, we automatically update.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-[#002C5F] mb-2">3. Two-Way Booking (Real-time)</h4>
              <p className="text-gray-700">
                When a patient books through MedHarmony, we create the appointment in your EHR/calendar immediately. No double-entry needed.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-bold text-[#002C5F] mb-2">4. Conflict Prevention (Smart)</h4>
              <p className="text-gray-700">
                If you manually book an appointment in your EHR, we detect it and mark that time unavailable. Never get double-booked.
              </p>
            </div>
          </div>
        </div>

        {/* Manual Import Option */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Or Import from CSV File</h3>
          <p className="text-gray-600 mb-4">
            Export your schedule from any system as CSV and upload it here.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-block px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              📁 Choose CSV File
            </label>
            {csvFile && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Selected: {csvFile.name}</p>
                <button
                  onClick={handleCSVImport}
                  disabled={importing}
                  className="mt-3 px-6 py-2 bg-[#008080] text-white font-semibold rounded-lg hover:bg-[#006666] disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Schedule'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                const csv = `Location,Day,StartTime,EndTime,Staff,Notes
"MedHarmony Labs - Main St",Monday,08:00,17:00,"Lisa Chen, Mark Johnson","Primary location"
"MedHarmony Labs - Main St",Tuesday,08:00,17:00,"Lisa Chen, Mark Johnson","Primary location"
"MedHarmony Labs - Oak Ave",Monday,09:00,15:00,"Amy Wu","Satellite office"`;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'schedule_template.csv';
                a.click();
              }}
              className="text-[#008080] hover:underline text-sm font-semibold"
            >
              ⬇️ Download CSV Template
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
