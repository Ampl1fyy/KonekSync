export type UserRole = 'worker' | 'business' | 'admin';
export type ShiftStatus = 'open' | 'filled' | 'active' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'maya' | 'gcash';
export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type Sector =
  | 'Retail'
  | 'Logistics'
  | 'Food & Beverage'
  | 'Healthcare'
  | 'Administrative'
  | 'Catering'
  | 'Events'
  | 'Cleaning';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  kyc_status: KYCStatus;
  kyc_document_url?: string;
  reliability_score: number;
  average_rating: number;
  total_ratings: number;
  e_wallet_number?: string;
  e_wallet_provider?: PaymentMethod;
  fee_waiver_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  industry?: string;
  logo_url?: string;
  address: string;
  city: string;
  is_verified: boolean;
  created_at: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface Shift {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  role_required: string;
  skill_id?: number;
  slots: number;
  slots_filled: number;
  hourly_rate: number;
  time_start: string;
  time_end: string;
  status: ShiftStatus;
  sector?: Sector;
  address: string;
  qr_code?: string;
  created_at: string;
  // joined
  businesses?: Business;
  skills?: Skill;
  distance_meters?: number;
}

export interface Application {
  id: string;
  shift_id: string;
  worker_id: string;
  status: ApplicationStatus;
  checked_in_at?: string;
  checked_out_at?: string;
  hours_worked?: number;
  created_at: string;
  // joined
  shifts?: Shift;
  profiles?: Profile;
}

export interface Transaction {
  id: string;
  application_id: string;
  worker_id: string;
  business_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  payment_reference?: string;
  initiated_at: string;
  completed_at?: string;
}

export interface Rating {
  id: string;
  application_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  application_id: string;
  raised_by: string;
  reason: string;
  description?: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  resolution_note?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  // joined
  profiles?: Pick<Profile, 'id' | 'full_name'>;
}

export interface Certification {
  id: string;
  worker_id: string;
  skill_id: number;
  file_path: string;
  is_verified: boolean;
  uploaded_at: string;
}

export interface InsuranceCoverage {
  id: string;
  application_id: string;
  worker_id: string;
  premium_paid: number;
  coverage_amount: number;
  provider: string;
  status: 'active' | 'claimed' | 'expired';
  opted_in_at: string;
}

export interface IncidentReport {
  id: string;
  application_id: string;
  worker_id: string;
  incident_type: string;
  description: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'rejected';
  resolution_note?: string;
  submitted_at: string;
}
