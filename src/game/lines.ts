import type { Player, Round } from './types';

/**
 * The words on the big moments. Kept pure so every case can be tested
 * without rendering a screen.
 */

/** "Jordan", "Jordan and Sam", "Jordan, Sam and Ari". */
export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function namesOf(ids: readonly string[], players: readonly Player[]): string[] {
  return ids.flatMap((id) => players.find((p) => p.id === id)?.name ?? []);
}

/** The line under the verdict word. */
export function verdictLine(round: Round, players: readonly Player[]): string {
  const imposters = listNames(namesOf(round.imposterIds, players));
  const accused = players.find((p) => p.id === round.accusedId)?.name;
  switch (round.outcome) {
    case 'stolen':
      return `${accused ?? imposters} guessed “${round.word}”.`;
    case 'caught': {
      if (round.imposterIds.length < 2 || !accused) return `It was ${imposters}.`;
      const others = listNames(namesOf(round.imposterIds.filter((id) => id !== round.accusedId), players));
      return `It was ${accused}. And ${others}.`;
    }
    case 'escaped':
      if (!accused) return `Nobody agreed. It was ${imposters}.`;
      return `${accused} was in. It was ${imposters}.`;
    default:
      return '';
  }
}
