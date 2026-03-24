import { CartRequestRow, MedicalRequestRow, WaterRequestRow } from './database';

export type {
  CartRequestInsert,
  CartRequestRow,
  LocationType,
  MedicalRequestInsert,
  ProfileRow,
  RequestStatus,
  WaterRequestRow,
} from './database';

export interface CartRequestWithFieldNames extends CartRequestRow {
  from_field_name?: string | null;
  to_field_name?: string | null;
}

export interface CartRequestWithDriver extends Omit<CartRequestWithFieldNames, 'driver'> {
  driver: {
    full_name: string | null;
  } | null;
}

export interface WaterRequestWithField extends WaterRequestRow {
  fields?: {
    name: string;
    location?: string | null;
  } | null;
}

export interface MedicalRequestWithRelations extends Omit<MedicalRequestRow, 'trainer'> {
  trainer: {
    full_name: string | null;
  } | null;
  fields: {
    name: string;
  } | null;
}
