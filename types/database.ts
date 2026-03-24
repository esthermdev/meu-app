import { Database } from '@/database.types';

export type CartRequestRow = Database['public']['Tables']['cart_requests']['Row'];
export type CartRequestInsert = Database['public']['Tables']['cart_requests']['Insert'];
export type DatetimeRow = Database['public']['Tables']['datetime']['Row'];
export type DivisionRow = Database['public']['Tables']['divisions']['Row'];
export type FieldRow = Database['public']['Tables']['fields']['Row'];
export type GameRow = Database['public']['Tables']['games']['Row'];
export type GameTypeRow = Database['public']['Tables']['gametypes']['Row'];
export type MedicalRequestRow = Database['public']['Tables']['medical_requests']['Row'];
export type MedicalRequestInsert = Database['public']['Tables']['medical_requests']['Insert'];
export type PoolRow = Database['public']['Tables']['pools']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type RankingRow = Database['public']['Tables']['rankings']['Row'];
export type RoundRow = Database['public']['Tables']['rounds']['Row'];
export type ScoreRow = Database['public']['Tables']['scores']['Row'];
export type TeamRow = Database['public']['Tables']['teams']['Row'];
export type VolunteerRow = Database['public']['Tables']['volunteers']['Row'];
export type WaterRequestRow = Database['public']['Tables']['water_requests']['Row'];

export type DivisionEnum = Database['public']['Enums']['division'];
export type LocationType = Database['public']['Enums']['location_type'];
export type RequestStatus = Database['public']['Enums']['request_status'];
