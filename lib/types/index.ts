export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'provider' | 'patient' | 'caregiver' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface ProviderProfile {
  id: string;
  specialty?: string;
  license_number?: string;
  organization?: string;
  created_at?: string;
}

export interface PatientProfile {
  id: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  insurance_info?: any;
  karma_score: number;
  reliability_percentage: number;
  created_at?: string;
}

export interface Order {
  id: string;
  patient_id: string;
  provider_id: string;
  order_type: string;
  title: string;
  description?: string;
  priority: 'routine' | 'urgent' | 'stat';
  due_within_days?: number;
  status: 'unscheduled' | 'scheduled' | 'completed' | 'cancelled';
  estimated_revenue?: number;
  created_at: string;
  updated_at: string;
}

export interface Prerequisite {
  id: string;
  order_id: string;
  provider_id?: string;
  prerequisite_type: string;
  description: string;
  is_required: boolean;
  created_at?: string;
}

export interface Appointment {
  id: string;
  order_id: string;
  patient_id: string;
  provider_id?: string;
  scheduled_start: string;
  scheduled_end: string;
  location: string;
  staff_assigned?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  confirmation_required: boolean;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityPreference {
  id: string;
  patient_id: string;
  preference_type: 'recurring_block' | 'one_time_block' | 'preferred_time' | 'notice_requirement';
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  block_start?: string;
  block_end?: string;
  preference_data?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  related_order_id?: string;
  related_appointment_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
}

export interface KarmaHistory {
  id: string;
  patient_id: string;
  action_type: string;
  points_change: number;
  related_appointment_id?: string;
  description?: string;
  created_at: string;
}

export interface CancellationAlert {
  id: string;
  cancelled_appointment_id: string;
  original_patient_id: string;
  notified_patient_id: string;
  alert_sent_at: string;
  claimed_at?: string;
  expires_at?: string;
  status: 'pending' | 'claimed' | 'expired' | 'ignored';
}

export interface AIScheduleOption {
  rank: number;
  datetime: string;
  location: string;
  staffAssigned?: string;
  reasoning: string;
  prerequisiteTimeline: Array<{
    prerequisite: string;
    when: string;
    description: string;
  }>;
  reminders: Array<{
    when: string;
    message: string;
  }>;
  karmaBonus: number;
  travelTimeMinutes?: number;
}
