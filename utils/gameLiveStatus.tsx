import { GameWithRelations } from '@/types/games';

/**
 * A game is "live" while the server-computed window [starts_at, ends_at) contains
 * `now` and the score hasn't been marked finished. `starts_at` / `ends_at` are
 * generated in Postgres in the tournament's timezone, so this never depends on the
 * device's timezone; `now` should come from `useServerTime()` so it doesn't depend
 * on the device's clock either.
 */
export const isGameLive = (game: Pick<GameWithRelations, 'datetime' | 'scores'>, now: Date): boolean => {
  const startsAt = game.datetime?.starts_at;
  const endsAt = game.datetime?.ends_at;
  if (!startsAt || !endsAt) return false;

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;

  const isFinished = game.scores?.[0]?.is_finished === true;
  const t = now.getTime();

  return !isFinished && start <= t && t < end;
};

/** True when a game has a livestream link and is currently live. */
export const hasLiveStream = (
  game: Pick<GameWithRelations, 'datetime' | 'scores' | 'livestream_link'>,
  now: Date,
): boolean => !!game.livestream_link?.trim() && isGameLive(game, now);
