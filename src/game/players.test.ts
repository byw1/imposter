import { addPlayer, cleanName, initial, movePlayer, nameProblem, nextColor, quickTable, removePlayer, renamePlayer, tiltFor } from './players';
import { MAX_PLAYERS, type Player } from './types';

const table = (names: string[]): Player[] => names.reduce<Player[]>((acc, name, i) => addPlayer(acc, name, `p${i}`), []);

describe('the roster', () => {
  it('cleans names', () => {
    expect(cleanName('  Maya   Lee  ')).toBe('Maya Lee');
    expect(cleanName('x'.repeat(40))).toHaveLength(16);
  });

  it('rejects blank, duplicate (any case) and one too many', () => {
    const players = table(['Maya', 'Jordan']);
    expect(nameProblem('  ', players)).toBe('empty');
    expect(nameProblem('maya', players)).toBe('taken');
    expect(nameProblem('Sam', players)).toBeNull();
    const full = table(Array.from({ length: MAX_PLAYERS }, (_, i) => `P${i}`));
    expect(nameProblem('One more', full)).toBe('full');
    expect(addPlayer(full, 'One more', 'x')).toHaveLength(MAX_PLAYERS);
  });

  it('lets a player keep their own name on rename, but not take another', () => {
    const players = table(['Maya', 'Jordan']);
    expect(nameProblem('MAYA', players, 'p0')).toBeNull();
    expect(renamePlayer(players, 'p0', 'Jordan')[0]!.name).toBe('Maya');
    expect(renamePlayer(players, 'p0', 'Mia')[0]!.name).toBe('Mia');
  });

  it('spreads colours evenly, never red or blue', () => {
    const players = table(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(players.slice(0, 6).map((p) => p.color)).toEqual(['purple', 'teal', 'yellow', 'orange', 'indigo', 'magenta']);
    expect(players[6]!.color).toBe('purple');
    expect(nextColor(removePlayer(players, 'p1'))).toBe('teal');
  });

  it('moves players between seats, staying put at the ends', () => {
    const players = table(['A', 'B', 'C']);
    expect(movePlayer(players, 'p2', -1).map((p) => p.name)).toEqual(['A', 'C', 'B']);
    expect(movePlayer(players, 'p0', -1).map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('gives each player an initial and a steady tilt', () => {
    expect(initial(' émile')).toBe('É');
    expect(tiltFor('ply_1')).toBe(tiltFor('ply_1'));
    for (const id of ['a', 'b', 'c', 'ply_123']) {
      expect(Math.abs(tiltFor(id))).toBeLessThanOrEqual(10);
    }
  });

  it('quick-starts a numbered table, each player with their own colour and number', () => {
    let n = 0;
    const table = quickTable(5, () => `id${n++}`);
    expect(table.map((p) => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);
    expect(new Set(table.map((p) => p.color)).size).toBe(5);
    expect(new Set(table.map((p) => p.id)).size).toBe(5);
    expect(table.map((p) => initial(p.name))).toEqual(['1', '2', '3', '4', '5']);
    expect(initial('Player 12')).toBe('12');
    expect(initial('Playerish')).toBe('P');
  });
});
