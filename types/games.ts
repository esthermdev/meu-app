import { DatetimeRow, FieldRow, GameRow, PoolRow, RoundRow, ScoreRow, TeamRow } from './database';

export type { DatetimeRow, FieldRow, GameRow, PoolRow, RoundRow, ScoreRow, TeamRow } from './database';

export interface GameWithRelations extends GameRow {
  datetime: DatetimeRow | null;
  team1: TeamRow | null;
  team2: TeamRow | null;
  scores: ScoreRow[] | null;
  field: FieldRow | null;
}

export interface GameWithRoundAndPool extends GameWithRelations {
  rounds: RoundRow | null;
  pool: PoolRow | null;
}
