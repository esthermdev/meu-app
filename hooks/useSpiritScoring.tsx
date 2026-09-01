import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { DatetimeRow, TeamRow, TeamSpiritRankingRow } from '@/types/database';
import { SpiritGame } from '@/types/spirit';
import { TeamWithDivisionDetails } from '@/types/teams';

const GAME_SELECT = `
  id,
  team1_id,
  team2_id,
  datetime: datetime_id (*),
  team1: team1_id (*),
  team2: team2_id (*),
  scores (is_finished)
`;

type GameQueryRow = {
  id: number;
  team1_id: number | null;
  team2_id: number | null;
  datetime: DatetimeRow | null;
  team1: TeamRow | null;
  team2: TeamRow | null;
  scores: { is_finished: boolean | null }[] | null;
};

/** Sort key for "most recent first". Times are zero-padded 24h, so they sort as strings. */
const playedAt = (game: SpiritGame): number => {
  const date = game.datetime?.date;
  if (!date) return 0;
  const parsed = new Date(`${date}T${game.datetime?.time ?? '00:00:00'}`).getTime();
  if (!Number.isNaN(parsed)) return parsed;
  const dateOnly = new Date(date).getTime();
  return Number.isNaN(dateOnly) ? 0 : dateOnly;
};

export const useSpiritScoring = () => {
  const { session, profile, refreshProfile } = useAuth();
  const userId = session?.user.id ?? null;
  const teamId = profile?.team_id ?? null;

  const [teams, setTeams] = useState<TeamWithDivisionDetails[]>([]);
  const [games, setGames] = useState<SpiritGame[]>([]);
  const [rankings, setRankings] = useState<TeamSpiritRankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedTeamId, setLoadedTeamId] = useState<number | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*, division_details: division_id (*)')
      .eq('display', true)
      .order('name');

    if (error) {
      console.error('Error fetching teams:', error);
      return;
    }
    setTeams(data as unknown as TeamWithDivisionDetails[]);
  }, []);

  const fetchGames = useCallback(async (id: number | null) => {
    if (!id) {
      setGames([]);
      setLoadedTeamId(id);
      return;
    }

    // Games this team played, plus whichever of them the team has already scored.
    const [gamesResult, submittedResult] = await Promise.all([
      supabase.from('games').select(GAME_SELECT).or(`team1_id.eq.${id},team2_id.eq.${id}`),
      supabase.from('spirit_scores').select('game_id, score').eq('rater_team_id', id),
    ]);

    if (gamesResult.error || submittedResult.error) {
      console.error('Error fetching spirit games:', gamesResult.error ?? submittedResult.error);
      Alert.alert('Error', 'Failed to load your games. Please try again.');
      // Mark it loaded anyway, or the screen is stranded in a spinner.
      setLoadedTeamId(id);
      return;
    }

    const scoreByGame = new Map((submittedResult.data ?? []).map((row) => [row.game_id, row.score]));

    const rows = (gamesResult.data ?? []) as unknown as GameQueryRow[];
    const played = rows
      .filter((row) => row.scores?.some((score) => score.is_finished))
      .map<SpiritGame>((row) => ({
        id: row.id,
        datetime: row.datetime,
        opponent: row.team1_id === id ? row.team2 : row.team1,
        submittedScore: scoreByGame.get(row.id) ?? null,
      }))
      // A bracket slot that never resolved to a real team cannot be scored.
      .filter((game) => game.opponent !== null)
      .sort((a, b) => playedAt(b) - playedAt(a));

    setGames(played);
    setLoadedTeamId(id);
  }, []);

  const fetchRankings = useCallback(async () => {
    const { data, error } = await supabase
      .from('team_spirit_rankings')
      .select('*')
      .order('division_id', { ascending: true })
      .order('division_rank', { ascending: true });

    if (error) {
      console.error('Error fetching spirit rankings:', error);
      return;
    }
    setRankings(data ?? []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTeams(), fetchGames(teamId), fetchRankings()]);
    setLoading(false);
  }, [fetchTeams, fetchGames, fetchRankings, teamId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Persist the team first: RLS reads spirit_scores through profiles.team_id. */
  const selectTeam = useCallback(
    async (newTeamId: number): Promise<boolean> => {
      if (!userId) return false;

      const { error } = await supabase.from('profiles').update({ team_id: newTeamId }).eq('id', userId);

      if (error) {
        console.error('Error saving team:', error);
        Alert.alert('Error', 'Failed to save your team. Please try again.');
        return false;
      }

      await refreshProfile();
      return true;
    },
    [userId, refreshProfile],
  );

  const submitScore = useCallback(
    async (gameId: number, opponentId: number, score: number, comments: string): Promise<boolean> => {
      if (!userId || !teamId) return false;

      setSubmitting(true);
      try {
        const { error } = await supabase.from('spirit_scores').insert({
          game_id: gameId,
          rater_team_id: teamId,
          rated_team_id: opponentId,
          submitted_by: userId,
          score,
          comments: comments.trim() || null,
        });

        if (error) {
          // 23505: a teammate got there first. Refresh so their score shows.
          if (error.code === '23505') {
            Alert.alert(
              'Already submitted',
              'Someone from your team has already reported the spirit score for this game.',
            );
            await fetchGames(teamId);
          } else {
            console.error('Error submitting spirit score:', error);
            Alert.alert('Error', 'Failed to submit spirit score. Please try again.');
          }
          return false;
        }

        await Promise.all([fetchGames(teamId), fetchRankings()]);
        return true;
      } finally {
        setSubmitting(false);
      }
    },
    [userId, teamId, fetchGames, fetchRankings],
  );

  // A team change is still "loading" until its games have actually arrived.
  const isLoading = loading || loadedTeamId !== teamId;

  return {
    teamId,
    teams,
    games,
    rankings,
    loading: isLoading,
    submitting,
    selectTeam,
    submitScore,
    refresh: loadData,
  };
};
