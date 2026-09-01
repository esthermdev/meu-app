import { DatetimeRow, TeamRow } from './database';

/**
 * A finished game from the perspective of one team: who they played and,
 * if someone on the team has already reported it, the score they gave.
 * `submittedScore` being non-null is what locks the game in the UI.
 */
export interface SpiritGame {
  id: number;
  datetime: DatetimeRow | null;
  opponent: TeamRow | null;
  submittedScore: number | null;
}
