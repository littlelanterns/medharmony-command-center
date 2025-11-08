'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const COMMON_PREREQUISITES = {
  lab: [
    { id: 'fasting_8h', type: 'fasting', description: 'Fast for 8 hours before appointment' },
    { id: 'stop_blood_thinner', type: 'medication_stop', description: 'Stop blood thinner medication 24 hours before' },
    { id: 'morning_preferred', type: 'preparation', description: 'Morning appointment preferred (for fasting compliance)' },
    { id: 'bring_insurance', type: 'bring_documents', description: 'Bring insurance card and ID' },
    { id: 'hydration', type: 'hydration', description: 'Drink plenty of water before appointment' },
  ],
  imaging: [
    { id: 'remove_metal', type: 'preparation', description: 'Remove all metal objects and jewelry' },
    { id: 'no_lotions', type: 'preparation', description: 'Do not wear lotions or deodorant' },
    { id: 'bring_insurance', type: 'bring_documents', description: 'Bring insurance card and ID' },
    { id: 'pregnancy_check', type: 'preparation', description: 'Inform if pregnant or possibly pregnant' },
  ],
  procedure: [
    { id: 'fasting_12h', type: 'fasting', description: 'Fast for 12 hours before procedure' },
    { id: 'bring_insurance', type: 'bring_documents', description: 'Bring insurance card and ID' },
    { id: 'arrange_ride', type: 'preparation', description: 'Arrange for someone to drive you home' },
    { id: 'stop_medications', type: 'medication_stop', description: 'Stop blood thinners as instructed' },
  ],
};

export default function CreateOrderPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
    orderType: 'lab',
    title: '',
    description: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    dueWithinDays: 14,
    estimatedRevenue: 200,
  });

  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);
  const [customPrerequisites, setCustomPrerequisites] = useState<Array<{ description: string }>>([]);
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(userData);
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'patient')
      .order('full_name');

    if (data) setPatients(data);
  };

  const handlePrerequisiteToggle = (prereqId: string) => {
    setSelectedPrerequisites(prev =>
      prev.includes(prereqId)
        ? prev.filter(id => id !== prereqId)
        : [...prev, prereqId]
    );
  };

  const addCustomPrerequisite = () => {
    setCustomPrerequisites([...customPrerequisites, { description: '' }]);
  };

  const handleCustomPrerequisiteChange = (index: number, value: string) => {
    const updated = [...customPrerequisites];
    updated[index].description = value;
    setCustomPrerequisites(updated);
  };

  const removeCustomPrerequisite = (index: number) => {
    setCustomPrerequisites(customPrerequisites.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build prerequisites array
      const availablePrereqs = COMMON_PREREQUISITES[formData.orderType as keyof typeof COMMON_PREREQUISITES] || [];
      const prerequisites = [
        ...availablePrereqs
          .filter(p => selectedPrerequisites.includes(p.id))
          .map(p => ({ type: p.type, description: p.description, isRequired: true })),
        ...customPrerequisites
          .filter(p => p.description.trim())
          .map(p => ({ type: 'custom', description: p.description, isRequired: true })),
      ];

      // Create order via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          providerId: user.id,
          orderType: formData.orderType,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueWithinDays: formData.dueWithinDays,
          estimatedRevenue: formData.estimatedRevenue,
          prerequisites,
          customNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/provider');
      } else {
        alert('Error creating order: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const availablePrereqs = COMMON_PREREQUISITES[formData.orderType as keyof typeof COMMON_PREREQUISITES] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#002C5F] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/provider')}
            className="text-white/80 hover:text-white mb-2 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Create New Order</h1>
          <p className="text-white/80 mt-1">Order a procedure or test for your patient</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Patient Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value="">-- Choose a patient --</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} ({patient.email})
                </option>
              ))}
            </select>
          </div>

          {/* Order Type */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Order Type *</label>
            <select
              required
              value={formData.orderType}
              onChange={(e) => {
                setFormData({ ...formData, orderType: e.target.value });
                setSelectedPrerequisites([]);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            >
              <option value="lab">Lab Work</option>
              <option value="imaging">Imaging / Radiology</option>
              <option value="procedure">Procedure</option>
              <option value="follow-up">Follow-up Visit</option>
            </select>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Order Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Fasting Bloodwork + Lipid Panel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Priority</label>
            <div className="flex gap-4">
              {(['routine', 'urgent', 'stat'] as const).map(priority => (
                <label key={priority} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">Prerequisites</label>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {availablePrereqs.map(prereq => (
                <label key={prereq.id} className="flex items-start cursor-pointer hover:bg-white p-2 rounded transition">
                  <input
                    type="checkbox"
                    checked={selectedPrerequisites.includes(prereq.id)}
                    onChange={() => handlePrerequisiteToggle(prereq.id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{prereq.description}</div>
                    <div className="text-sm text-gray-500">Type: {prereq.type}</div>
                  </div>
                </label>
              ))}

              {customPrerequisites.map((prereq, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={prereq.description}
                    onChange={(e) => handleCustomPrerequisiteChange(index, e.target.value)}
                    placeholder="Custom prerequisite description..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#008080]"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomPrerequisite(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addCustomPrerequisite}
                className="text-[#008080] hover:text-[#006666] font-semibold text-sm"
              >
                + Add Custom Prerequisite
              </button>
            </div>
          </div>

          {/* Custom Notes */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Special Notes</label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., Patient has needle anxiety - request experienced phlebotomist"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            />
          </div>

          {/* Estimated Revenue */}
          <div className="mb-8">
            <label className="block text-gray-700 font-semibold mb-2">Estimated Revenue</label>
            <input
              type="number"
              value={formData.estimatedRevenue}
              onChange={(e) => setFormData({ ...formData, estimatedRevenue: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating Order...' : 'Send Order to Patient'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/provider')}
              className="px-8 py-3 border-2 border-gray-300 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
