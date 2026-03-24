import { DivisionRow, PoolRow, TeamRow } from './database';

export interface TeamWithDetails extends TeamRow {
  pool: PoolRow | null;
  division_details: DivisionRow | null;
  is_favorited?: boolean;
}

export interface TeamWithDivisionDetails extends TeamRow {
  division_details?: DivisionRow | null;
}
