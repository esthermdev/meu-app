import { RankingRow, TeamRow } from './database';

export interface StandingWithTeam extends RankingRow {
  teams: TeamRow | null;
}

export interface Standings {
  title: string;
  poolId: number;
  data: StandingWithTeam[];
}
